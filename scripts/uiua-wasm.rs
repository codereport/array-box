use serde::Serialize;
use uiua::{Compiler, Diagnostic, Span, Uiua, UiuaError, Value};
use wasm_bindgen::prelude::*;

#[derive(Serialize)]
struct EvalResult {
    success: bool,
    output: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    stack: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    formatted: Option<String>,
    glyph_map: Vec<[usize; 4]>,
    diagnostics: Vec<EditorDiagnostic>,
}

#[derive(Serialize)]
struct FormatResult {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    formatted: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
    glyph_map: Vec<[usize; 4]>,
    diagnostics: Vec<EditorDiagnostic>,
}

#[derive(Serialize)]
struct EditorDiagnostic {
    kind: String,
    message: String,
    line: Option<u32>,
    column: Option<u32>,
}

fn editor_diagnostic(diagnostic: Diagnostic) -> EditorDiagnostic {
    let location = match &diagnostic.span {
        Span::Code(span) => Some((span.start.line, span.start.col)),
        Span::Builtin => None,
    };
    EditorDiagnostic {
        kind: format!("{:?}", diagnostic.kind).to_lowercase(),
        message: diagnostic.message,
        line: location.map(|(line, _)| u32::from(line)),
        column: location.map(|(_, column)| u32::from(column)),
    }
}

fn format_code(code: &str) -> FormatResult {
    let config = uiua::format::FormatConfig {
        trailing_newline: false,
        ..Default::default()
    };
    match uiua::format::format_str(code, &config) {
        Ok(formatted) => {
            // DOM ranges count UTF-16 code units; Uiua source locations include
            // byte offsets, which also handle emoji and combining characters.
            let utf16 = |text: &str, byte: u32| text[..byte as usize].encode_utf16().count();
            let glyph_map = formatted
                .glyph_map
                .iter()
                .map(|(span, (start, end))| {
                    [
                        utf16(code, span.start.byte_pos),
                        utf16(code, span.end.byte_pos),
                        utf16(&formatted.output, start.byte_pos),
                        utf16(&formatted.output, end.byte_pos),
                    ]
                })
                .collect();
            FormatResult {
                success: true,
                formatted: Some(formatted.output),
                error: None,
                glyph_map,
                diagnostics: Vec::new(),
            }
        }
        Err(error) => FormatResult {
            success: false,
            formatted: None,
            error: Some(error.to_string()),
            glyph_map: Vec::new(),
            diagnostics: Vec::new(),
        },
    }
}

/// Use the parser's exact prefix, alias, and concatenated-name rules.
#[wasm_bindgen]
pub fn uiua_name_tokens(name: &str) -> String {
    let tokens = uiua::split_name(name).map(|parts| {
        parts
            .into_iter()
            .map(|(component, text)| (text.to_string(), component.to_string()))
            .collect::<Vec<_>>()
    });
    serde_json::to_string(&tokens).unwrap()
}

fn value_to_string(value: &Value) -> String {
    value.show()
}

fn format_error(error: &UiuaError) -> String {
    error.to_string()
}

#[wasm_bindgen]
pub fn eval_uiua(code: &str) -> String {
    let mut env = Uiua::with_safe_sys();

    // Try to format the code (converts keyboard prefixes to symbols)
    let format = format_code(code);
    let formatted = format.formatted;
    let glyph_map = format.glyph_map;

    // Use formatted code for evaluation if available, otherwise original
    let code_to_run = formatted.as_deref().unwrap_or(code);

    let mut diagnostics = Vec::new();
    let execution = env.compile_run(|compiler| {
        compiler.print_diagnostics(false);
        let result = compiler.load_str(code_to_run).map(|_| ());
        diagnostics = compiler
            .take_diagnostics()
            .into_iter()
            .map(editor_diagnostic)
            .collect();
        result.map(|_| compiler)
    });
    let result = match execution {
        Ok(_) => {
            let stack: Vec<String> = env.stack().iter().map(value_to_string).collect();
            let output = if stack.is_empty() {
                String::new()
            } else {
                stack.join("\n")
            };
            EvalResult {
                success: true,
                output,
                error: None,
                stack: Some(stack),
                formatted,
                glyph_map,
                diagnostics,
            }
        }
        Err(e) => {
            // Try to get partial output from stack
            let stack: Vec<String> = env.stack().iter().map(value_to_string).collect();
            let partial_output = if stack.is_empty() {
                String::new()
            } else {
                stack.join("\n")
            };

            let error_msg = format_error(&e);
            let output = if partial_output.is_empty() {
                error_msg.clone()
            } else {
                format!("{}\n{}", partial_output, error_msg)
            };

            EvalResult {
                success: false,
                output,
                error: Some(error_msg),
                stack: if stack.is_empty() { None } else { Some(stack) },
                formatted,
                glyph_map,
                diagnostics,
            }
        }
    };

    serde_json::to_string(&result).unwrap_or_else(|e| {
        format!(r#"{{"success":false,"output":"Serialization error: {}","error":"Serialization error"}}"#, e)
    })
}

#[wasm_bindgen]
pub fn format_uiua(code: &str) -> String {
    let mut result = format_code(code);
    if let Some(formatted) = &result.formatted {
        let mut compiler = Compiler::new();
        compiler.print_diagnostics(false);
        let _ = compiler.load_str(formatted);
        result.diagnostics = compiler
            .take_diagnostics()
            .into_iter()
            .map(editor_diagnostic)
            .collect();
    }

    serde_json::to_string(&result).unwrap_or_else(|e| {
        format!(
            r#"{{"success":false,"error":"Serialization error: {}"}}"#,
            e
        )
    })
}

#[wasm_bindgen]
pub fn uiua_version() -> String {
    uiua::VERSION.to_string()
}
