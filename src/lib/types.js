        
    //
    // parser types
    var    
        DEFAULTSTYLE,
        DEFAULTERROR,
        
        //
        // javascript variable types
        INF = Infinity,
        T_NUM = 2,
        T_BOOL = 4,
        T_STR = 8,
        T_CHAR = 9,
        T_CHARLIST = 10,
        T_REGEX = 16,
        T_ARRAY = 32,
        T_OBJ = 64,
        T_NULL = 128,
        T_UNDEF = 256,
        T_UNKNOWN = 512,
        
        //
        // matcher types
        T_SIMPLEMATCHER = 2,
        T_COMPOSITEMATCHER = 4,
        T_BLOCKMATCHER = 8,
        
        //
        // token types
        T_ERROR = 4,
        T_DEFAULT = 8,
        T_SIMPLE = 16,
        T_EOL = 17,
        T_NONSPACE = 18,
        T_BLOCK = 32,
        T_ESCBLOCK = 33,
        T_COMMENT = 34,
        T_EITHER = 64,
        T_ALL = 128,
        T_REPEATED = 256,
        T_ZEROORONE = 257,
        T_ZEROORMORE = 258,
        T_ONEORMORE = 259,
        T_GROUP = 512,
        T_NGRAM = 1024,
        /*T_INDENT = 2048,
        T_INDENTBEFORE = 2049,
        T_DEDENT = 4096,
        T_DEDENTBEFORE = 4097,*/
        
        //
        // tokenizer types
        groupTypes = {
            ONEOF: T_EITHER, EITHER: T_EITHER, ALL: T_ALL, 
            ZEROORONE: T_ZEROORONE, ZEROORMORE: T_ZEROORMORE, ONEORMORE: T_ONEORMORE, 
            REPEATED: T_REPEATED
        },
        
        tokenTypes = {
            //INDENT: T_INDENT, INDENTBEFORE: T_INDENTBEFORE, DEDENT: T_DEDENT, DEDENTBEFORE: T_DEDENTBEFORE, 
            BLOCK: T_BLOCK, COMMENT: T_COMMENT, ESCAPEDBLOCK: T_ESCBLOCK, 
            SIMPLE: T_SIMPLE, GROUP: T_GROUP, NGRAM: T_NGRAM
        }
    ;
