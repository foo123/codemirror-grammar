// 1. a partial scheme grammar in simple JSON format
// https://people.csail.mit.edu/jaffer/r5rs_9.html
var scheme_grammar = {
    
    // prefix ID for regular expressions used in the grammar
    "RegExpID": "RE::",

    "Extra": {
        "fold" : "indent"
    },
    
    // Style model
    "Style": {
        // lang token type  -> Editor (style) tag
        "comment":              "comment",
        "keyword":              "builtin",
        "expression_keyword":   "builtin",
        "identifier":           "variable",
        "peculiar_identifier":  "variable",
        "number":               "number",
        "boolean":              "builtin",
        "string":               "string"
    },

    // Lexical model
    "Lex": {
    
        // comments
        "comment:comment" : {
            "interleave": true,
            // null delimiter, matches end-of-line
            "tokens" : [ [";",  null], ["#|",  "|#"] ]
        },
        "identifier": "RE::/[a-z!$%&*\\/:<=>?\\^_~][0-9a-z!$%&*\\/:<=>?\\^_~+\\-.@]*/i",
        "peculiar_identifier": "RE::/\\.\\.\\.|\\+|-/",
        "boolean": {
            "autocomplete" : true,
            "tokens": ["#t", "#f"]
        },
        "string:escaped-block" : [ "\"" ],
        "number" : [
        "RE::/^(?:[-+]i|[-+][01]+#*(?:\\/[01]+#*)?i|[-+]?[01]+#*(?:\\/[01]+#*)?@[-+]?[01]+#*(?:\\/[01]+#*)?|[-+]?[01]+#*(?:\\/[01]+#*)?[-+](?:[01]+#*(?:\\/[01]+#*)?)?i|[-+]?[01]+#*(?:\\/[01]+#*)?)(?=[()\\s;\"]|$)/i",
        "RE::/^(?:[-+]i|[-+][0-7]+#*(?:\\/[0-7]+#*)?i|[-+]?[0-7]+#*(?:\\/[0-7]+#*)?@[-+]?[0-7]+#*(?:\\/[0-7]+#*)?|[-+]?[0-7]+#*(?:\\/[0-7]+#*)?[-+](?:[0-7]+#*(?:\\/[0-7]+#*)?)?i|[-+]?[0-7]+#*(?:\\/[0-7]+#*)?)(?=[()\\s;\"]|$)/i",
        "RE::/^(?:[-+]i|[-+][\\da-f]+#*(?:\\/[\\da-f]+#*)?i|[-+]?[\\da-f]+#*(?:\\/[\da-f]+#*)?@[-+]?[\\da-f]+#*(?:\\/[\\da-f]+#*)?|[-+]?[\\da-f]+#*(?:\\/[\\da-f]+#*)?[-+](?:[\\da-f]+#*(?:\\/[\da-f]+#*)?)?i|[-+]?[\\da-f]+#*(?:\\/[\\da-f]+#*)?)(?=[()\\s;\"]|$)/i",
        "RE::/^(?:[-+]i|[-+](?:(?:(?:\\d+#+\\.?#*|\\d+\\.\\d*#*|\\.\\d+#*|\\d+)(?:[esfdl][-+]?\\d+)?)|\\d+#*\\/\\d+#*)i|[-+]?(?:(?:(?:\\d+#+\\.?#*|\\d+\\.\\d*#*|\\.\\d+#*|\\d+)(?:[esfdl][-+]?\\d+)?)|\\d+#*\\/\\d+#*)@[-+]?(?:(?:(?:\\d+#+\\.?#*|\\d+\\.\\d*#*|\\.\\d+#*|\\d+)(?:[esfdl][-+]?\\d+)?)|\\d+#*\\/\\d+#*)|[-+]?(?:(?:(?:\\d+#+\\.?#*|\\d+\\.\\d*#*|\\.\\d+#*|\\d+)(?:[esfdl][-+]?\\d+)?)|\\d+#*\\/\\d+#*)[-+](?:(?:(?:\\d+#+\\.?#*|\\d+\\.\\d*#*|\\.\\d+#*|\\d+)(?:[esfdl][-+]?\\d+)?)|\\d+#*\\/\\d+#*)?i|(?:(?:(?:\\d+#+\\.?#*|\\d+\\.\\d*#*|\\.\\d+#*|\\d+)(?:[esfdl][-+]?\\d+)?)|\\d+#*\\/\\d+#*))(?=[()\\s;\"]|$)/i"
        ],

        "expression_keyword": {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "combine": "(\\s|\\W)",
            "tokens": ["lambda", "if",
                 "set!", "begin", "cond", "and", "or", "case",
                 "let", "let*", "letrec", "do", "delay"]
        },
     
        // keywords
        "keyword" : {
            // enable autocompletion for these tokens, with their associated token ID
            "autocomplete" : true,
            "combine": "(\\s|\\W)",
            "tokens": ["case-lambda", "call/cc", "class", "define-class", "exit-handler", "field", "import", "inherit", "init-field", "interface", "let*-values", "let-values", "let/ec", "mixin", "opt-lambda", "override", "protect", "provide", "public", "rename", "require", "require-for-syntax", "syntax", "syntax-case", "syntax-error", "unit/sig", "unless", "when", "with-syntax", "and", "begin", "call-with-current-continuation", "call-with-input-file", "call-with-output-file", "case", "cond", "define", "define-syntax", "delay", "do", "dynamic-wind", "else", "for-each", "if", "lambda", "let", "let*", "let-syntax", "letrec", "letrec-syntax", "map", "or", "syntax-rules", "abs", "acos", "angle", "append", "apply", "asin", "assoc", "assq", "assv", "atan", "boolean?", "caar", "cadr", "call-with-input-file", "call-with-output-file", "call-with-values", "car", "cdddar", "cddddr", "cdr", "ceiling", "char->integer", "char-alphabetic?", "char-ci<=?", "char-ci<?", "char-ci=?", "char-ci>=?", "char-ci>?", "char-downcase", "char-lower-case?", "char-numeric?", "char-ready?", "char-upcase", "char-upper-case?", "char-whitespace?", "char<=?", "char<?", "char=?", "char>=?", "char>?", "char?", "close-input-port", "close-output-port", "complex?", "cons", "cos", "current-input-port", "current-output-port", "denominator", "display", "eof-object?", "eq?", "equal?", "eqv?", "eval", "even?", "exact->inexact", "exact?", "exp", "expt", "floor", "force", "gcd", "imag-part", "inexact->exact", "inexact?", "input-port?", "integer->char", "integer?", "interaction-environment", "lcm", "length", "list", "list->string", "list->vector", "list-ref", "list-tail", "list?", "load", "log", "magnitude", "make-polar", "make-rectangular", "make-string", "make-vector", "max", "member", "memq", "memv", "min", "modulo", "negative?", "newline", "not", "null-environment", "null?", "number->string", "number?", "numerator", "odd?", "open-input-file", "open-output-file", "output-port?", "pair?", "peek-char", "port?", "positive?", "procedure?", "quasiquote", "quote", "quotient", "rational?", "rationalize", "read", "read-char", "real-part", "real?", "remainder", "reverse", "round", "scheme-report-environment", "set!", "set-car!", "set-cdr!", "sin", "sqrt", "string", "string->list", "string->number", "string->symbol", "string-append", "string-ci<=?", "string-ci<?", "string-ci=?", "string-ci>=?", "string-ci>?", "string-copy", "string-fill!", "string-length", "string-ref", "string-set!", "string<=?", "string<?", "string=?", "string>=?", "string>?", "string?", "substring", "symbol->string", "symbol?", "tan", "transcript-off", "transcript-on", "truncate", "values", "vector", "vector->list", "vector-fill!", "vector-length", "vector-ref", "vector-set!", "with-input-from-file", "with-output-to-file", "write", "write-char", "zero?"]
        }
    },

    // Syntax model (optional)
    "Syntax": {
        "token": "boolean | number | string | keyword | identifier | peculiar_identifier"
    },
    
    // what to parse and in what order
    "Parser" : ["comment",["token"]]
};
