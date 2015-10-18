"use strict";

//
// parser types
var    
    DEFAULTSTYLE, DEFAULTERROR,
    
    TOKENS = 1, ERRORS = 2, FLAT = 32, REQUIRED = 4, ERROR = 8,
    CLEAR_REQUIRED = ~REQUIRED, CLEAR_ERROR = ~ERROR,
    REQUIRED_OR_ERROR = REQUIRED | ERROR,
    
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
    A_OVERWR = 2048,
    
    // pattern types
    P_SIMPLE = 2,
    P_COMPOSITE = 4,
    P_BLOCK = 8,
    
    // token types
    T_ACTION = 4,
    T_SOF = 8, T_EOF = 16, T_SOL = 32, T_EOL = 64,
    T_SOF_OR_SOL = T_SOF|T_SOL,
    T_EMPTY = 128, T_NONSPACE = 256,
    T_SIMPLE = 512,
    T_BLOCK = 1024, T_COMMENT = 1025,
    T_EITHER = 2048,
    T_SEQUENCE = 4096,
    T_REPEATED = 8192,
    T_ZEROORONE = 8193, T_ZEROORMORE = 8194, T_ONEORMORE = 8195,
    T_GROUP = 16384, T_NGRAM = 32768,
    T_SEQUENCE_OR_NGRAM = T_SEQUENCE|T_NGRAM,
    
    // tokenizer types
    groupTypes = {
    either: T_EITHER,
    sequence: T_SEQUENCE, ALL: T_SEQUENCE,
    zeroorone: T_ZEROORONE,
    zeroormore: T_ZEROORMORE,
    oneormore: T_ONEORMORE,
    repeated: T_REPEATED
    },
    
    tokenTypes = {
    action: T_ACTION,
    simple: T_SIMPLE,
    block: T_BLOCK,
    comment: T_COMMENT,
    group: T_GROUP,
    ngram: T_NGRAM
    }
;
