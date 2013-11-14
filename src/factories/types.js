        
    //
    // parser types
    var    
        //
        // token types
        T_ERROR = -1,
        T_DEFAULT = 0,
        T_META = 1,
        T_DEF = 2,
        T_ATOM = 3,
        T_KEYWORD = 4,
        T_BUILTIN = 5,
        T_COMMENT = 6,
        T_OP = 7,
        T_DELIM = 8,
        T_STRING = 9,
        T_HEREDOC = 10,
        T_NUMBER = 11,
        T_IDENTIFIER = 12,
        T_PROPERTY = 13,
        T_QUALIFIER = 14,
        T_ATTRIBUTE = 15,
        T_AUTOCLOSEDTAG = 16,
        T_IMPLICITLYCLOSEDTAG = 17,
        T_TAG = 18,
        T_ENDTAG = 19,
        T_CDATA = 20,
        T_DOCTYPE = 21,
        
        //
        // indentation types
        T_TOP_LEVEL = 100,
        T_STATEMENT_LEVEL = 110,
        T_DELIM_LEVEL = 120,
        T_BLOCK_LEVEL = 130,
        T_DO_INDENT = 140,
        T_DO_DEDENT = 150,
        
        //
        // tokenizer types
        T_TOKENBASE = 200,
        T_TOKENBASEML = 220,
        T_TOKEN = 210
    ;
