use serde::Serialize;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::Path;
use globset::{Glob, GlobSetBuilder};
use regex::Regex;

#[derive(Serialize)]
pub struct SearchResult {
    pub file_path: String,
    pub line_number: usize,
    pub line_text: String,
}

#[tauri::command]
pub fn search_in_files(
    dir_path: String, 
    query: String,
    include_pattern: Option<String>,
    exclude_pattern: Option<String>,
    match_case: bool,
    match_whole_word: bool,
    use_regex: bool,
) -> Result<Vec<SearchResult>, String> {
    let mut results = Vec::new();
    if query.trim().is_empty() {
        return Ok(results);
    }

    let re = if use_regex {
        let pattern = if match_case { &query } else { &format!("(?i){}", query) };
        Regex::new(pattern).map_err(|e| format!("Invalid Regex: {}", e))?
    } else {
        let escaped = regex::escape(&query);
        let pattern = if match_whole_word {
            format!(r"\b{}\b", escaped)
        } else {
            escaped
        };
        let final_pat = if match_case { pattern } else { format!("(?i){}", pattern) };
        Regex::new(&final_pat).map_err(|e| format!("Regex Error: {}", e))?
    };

    let mut includes_builder = GlobSetBuilder::new();
    if let Some(inc) = include_pattern {
        for pat in inc.split(',') {
            let pat = pat.trim();
            if !pat.is_empty() {
                let glob_str = if pat.starts_with('*') && !pat.starts_with("**") {
                    format!("**/{}", pat)
                } else {
                    pat.to_string()
                };
                if let Ok(glob) = Glob::new(&glob_str) {
                    includes_builder.add(glob);
                }
            }
        }
    }
    let includes = includes_builder.build().unwrap_or_default();

    let mut excludes_builder = GlobSetBuilder::new();
    if let Some(exc) = exclude_pattern {
        for pat in exc.split(',') {
            let pat = pat.trim();
            if !pat.is_empty() {
                let glob_str = if pat.starts_with('*') && !pat.starts_with("**") {
                    format!("**/{}", pat)
                } else {
                    pat.to_string()
                };
                if let Ok(glob) = Glob::new(&glob_str) {
                    excludes_builder.add(glob);
                }
            }
        }
    }
    let excludes = excludes_builder.build().unwrap_or_default();
    
    search_recursive(
        Path::new(&dir_path), 
        &re, 
        &includes,
        &excludes,
        &mut results
    ).map_err(|e| e.to_string())?;
    
    Ok(results)
}

fn search_recursive(
    dir: &Path, 
    re: &Regex, 
    includes: &globset::GlobSet,
    excludes: &globset::GlobSet,
    results: &mut Vec<SearchResult>
) -> std::io::Result<()> {
    if dir.is_dir() {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_dir() {
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    if !name.starts_with('.') {
                        search_recursive(&path, re, includes, excludes, results)?;
                    }
                }
            } else {
                let path_str = path.to_string_lossy().replace('\\', "/");
                
                if !excludes.is_empty() && excludes.is_match(&path_str) {
                    continue;
                }
                if !includes.is_empty() && !includes.is_match(&path_str) {
                    continue;
                }

                if let Ok(file) = fs::File::open(&path) {
                    let reader = BufReader::new(file);
                    let mut line_number = 1;
                    
                    for line in reader.lines().map_while(Result::ok) {
                        if re.is_match(&line) {
                            results.push(SearchResult {
                                file_path: path.to_string_lossy().to_string(),
                                line_number,
                                line_text: line.trim().to_string(),
                            });
                        }
                        line_number += 1;
                    }
                }
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub fn replace_in_file(
    file_path: String, 
    query: String, 
    replace_text: String, 
    match_case: bool, 
    match_whole_word: bool, 
    use_regex: bool,
    preserve_case: bool,
) -> Result<(), String> {
    let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    
    let re = if use_regex {
        let pattern = if match_case { &query } else { &format!("(?i){}", query) };
        Regex::new(pattern).map_err(|e| format!("Invalid Regex: {}", e))?
    } else {
        let escaped = regex::escape(&query);
        let pattern = if match_whole_word {
            format!(r"\b{}\b", escaped)
        } else {
            escaped
        };
        let final_pat = if match_case { pattern } else { format!("(?i){}", pattern) };
        Regex::new(&final_pat).map_err(|e| format!("Regex Error: {}", e))?
    };

    let new_content = if preserve_case {
        re.replace_all(&content, |caps: &regex::Captures| {
            let matched = &caps[0];
            // Deteksi case dari matched text
            if matched.chars().all(|c| c.is_uppercase()) {
                replace_text.to_uppercase()
            } else if matched.chars().next().map_or(false, |c| c.is_uppercase()) {
                let mut c_chars = replace_text.chars();
                match c_chars.next() {
                    None => String::new(),
                    Some(f) => f.to_uppercase().to_string() + c_chars.as_str(),
                }
            } else {
                replace_text.to_lowercase()
            }
        }).into_owned()
    } else {
        re.replace_all(&content, replace_text.as_str()).into_owned()
    };

    fs::write(&file_path, new_content).map_err(|e| e.to_string())?;
    Ok(())
}
