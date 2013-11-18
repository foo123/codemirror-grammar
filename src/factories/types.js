        
    //
    // parser types
    var    
        //
        // javascript variable types
        T_NUM = 2;
        T_BOOL = 4;
        T_STR = 8;
        T_CHAR= 9;
        T_REGEX = 16;
        T_ARRAY = 32;
        T_OBJ = 64;
        T_NULL = 128;
        T_UNDEF = 256;
        T_UNKNOWN = 512;
        
        //
        // grammar types
        T_PROGRAMMING_LIKE = 1,
        T_MARKUP_LIKE = 2,
        
        //
        // token types
        T_DEFAULT = 1,
        T_META = 2,
        T_COMMENT = 4,
        T_DEF = 8,
        T_ATOM = 16,
        T_KEYWORD = 32,
        T_BUILTIN = 64,
        T_STRING = 128,
        T_IDENTIFIER = 256,
        T_NUMBER = 512,
        T_TAG = 1024,
        T_ATTRIBUTE = 2048,
        T_ASSIGNMENT = 4096,
        T_ENDTAG = 8192,
        T_ERROR = 16384,
        T_BLOCK = 32768,
        T_DOCTYPE = 65536,
        T_OP = 131072,
        T_DELIM = 262144,
        
        //
        // matcher types
        T_SIMPLEMATCHER = 32,
        T_CHARMATCHER = 33,
        T_STRMATCHER = 34,
        T_REGEXMATCHER = 36,
        T_EOLMATCHER = 40,
        T_DUMMYMATCHER = 48,
        T_COMPOSITEMATCHER = 64,
        T_BLOCKMATCHER = 128,
        T_TAGMATCHER = 256,
        
        //
        // tokenizer types
        T_TOKENBASE = 200,
        T_TOKENBASEML = 210,
        T_TOKEN = 220//,
        
        //
        // indentation types
        /*T_TOP_LEVEL = 100,
        T_STATEMENT_LEVEL = 110,
        T_DELIM_LEVEL = 120,
        T_BLOCK_LEVEL = 130,
        T_DO_INDENT = 140,
        T_DO_DEDENT = 150*/
    ;
