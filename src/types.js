"use strict";

//
// parser types
var    
    DEFAULTSTYLE,
    DEFAULTERROR,
    
    TOKENS = 1, ERRORS = 2,
    REQUIRED = 4, ERROR = 8,
    CLEAR_REQUIRED = ~REQUIRED, CLEAR_ERROR = ~ERROR,
    REQUIRED_OR_ERROR = REQUIRED | ERROR,
    
    //
    // javascript variable types
    INF = Infinity,
    
    //
    // action types
    A_ERROR = 4,
    A_UNIQUE = 8,
    A_PUSH = 16,
    A_POP = 32,
    A_EMPTY = 64,
    A_INDENT = 128,
    A_OUTDENT = 256,
    A_CTXSTART = 512,
    A_CTXEND = 1024,
    
    //
    // pattern types
    P_SIMPLE = 2,
    P_COMPOSITE = 4,
    P_BLOCK = 8,
    
    //
    // token types
    //T_SPACE = 0,
    T_SOF = 4, T_EOF = 8, T_SOL = 16, T_EOL = 32,
    T_SOF_OR_SOL = T_SOF|T_SOL,
    T_EMPTY = 64, T_NONSPACE = 128,
    //T_EMPTY_OR_NONSPACE = T_EMPTY|T_NONSPACE,
    //T_NOT_EMPTY_NOR_NONSPACE = ~T_EMPTY_OR_NONSPACE,
    T_SIMPLE = 256,
    T_BLOCK = 512,
    T_ESCBLOCK = 513,
    T_COMMENT = 514,
    T_EITHER = 1024,
    T_SEQUENCE = 2048,
    T_ALL = T_SEQUENCE,
    T_REPEATED = 4096,
    T_ZEROORONE = 4097,
    T_ZEROORMORE = 4098,
    T_ONEORMORE = 4099,
    T_GROUP = 8192,
    T_NGRAM = 16384,
    T_SEQUENCE_OR_NGRAM = T_SEQUENCE | T_NGRAM,
    T_ACTION = 32768,
    //T_SOF_SOL_EOL_EOF_ACTION = T_SOF_SOL_EOL_EOF|T_ACTION,
    
    //
    // tokenizer types
    groupTypes = {
    EITHER: T_EITHER,
    ALL: T_ALL,
    SEQUENCE: T_SEQUENCE,
    ZEROORONE: T_ZEROORONE,
    ZEROORMORE: T_ZEROORMORE,
    ONEORMORE: T_ONEORMORE,
    REPEATED: T_REPEATED
    },
    
    tokenTypes = {
    ACTION: T_ACTION,
    BLOCK: T_BLOCK,
    COMMENT: T_COMMENT,
    ESCAPEDBLOCK: T_ESCBLOCK,
    SIMPLE: T_SIMPLE,
    GROUP: T_GROUP,
    NGRAM: T_NGRAM
    }
;
