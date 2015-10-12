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
    A_BLOCKINDENT = 512,
    A_CTX_START = 1024,
    A_CTX_END = 2048,
    
    //
    // pattern types
    P_SIMPLE = 2,
    P_COMPOSITE = 4,
    P_BLOCK = 8,
    
    //
    // token types
    //T_SPACE = 0,
    T_ERROR = 4,
    T_DEFAULT = 8,
    T_SIMPLE = 16,
    T_EOL = 17,
    T_NONSPACE = 18,
    T_EMPTY = 20,
    T_BLOCK = 32,
    T_ESCBLOCK = 33,
    T_COMMENT = 34,
    T_EITHER = 64,
    T_SEQUENCE = 128,
    T_ALL = T_SEQUENCE,
    T_REPEATED = 256,
    T_ZEROORONE = 257,
    T_ZEROORMORE = 258,
    T_ONEORMORE = 259,
    T_GROUP = 512,
    T_NGRAM = 1024,
    T_SEQUENCE_OR_NGRAM = T_SEQUENCE | T_NGRAM,
    T_ACTION = 2048,
    
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
    },
    
    actionTypes = {
    ERROR: A_ERROR,
    UNIQUE: A_UNIQUE,
    PUSH: A_PUSH,
    POP: A_POP,
    EMPTY: A_EMPTY,
    INDENT: A_INDENT,
    OUTDENT: A_OUTDENT,
    BLOCKINDENT: A_BLOCKINDENT,
    CONTEXT_START: A_CTX_START,
    CONTEXT_END: A_CTX_END
    }
;
