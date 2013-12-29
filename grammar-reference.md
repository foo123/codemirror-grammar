##Grammar configuration options


###Extra Settings

* __Grammar.RegExpID__ defines the prefix ID for any regular expressions (represented as strings) used in the grammar


###Style model

Grammar.Style model defines the mapping of tokens to editor styles and is a map of the form:

__tokenID__  -> __Editor style tag__


###Lexical model

Grammar.Lex model defines the mapping of token patterns and token configuration to an associated tokenID and is a map of the form:

__tokenID__  -> __token configuration__


__token configuration__ can be:

* a pattern or array of patterns
* an object having (some or all of) the following properties:
    1. "type" : token type (default "simple" )
    2. "tokens": pattern or array of patterns for this token
    3. properties depending on token type (see below)
    
    
* a token type can be "simple" (default), "comment", "block", "escaped-block"
* a literal string becomes a token (eg inside Syntax model sequence) with a tokenID same as its literal value
* a token can be defined using just the tokenID and the token pattern(s), token type is assumed "simple" 
* "simple" tokens are grouped into one regular expression by default using "\\b" (word-boundary) delimiter, this is usefull for speed fine-tuning the parser adding the "combine" property in the token configuration, can alter this option, or use a different delimiter
* "simple" tokens can also be used to enable keyword autocomplete functionality ("autocomplete" : true, option )
* "comment", "block", "escaped-block" token types take pairs of patterns [start-pattern, end-pattern]
    1. if "end-pattern" is missing, "end-pattern" is same as "start-pattern"
    2. if "end-pattern" has the value null, "end-pattern" matches end-of-line (eg. in single line comment blocks)
    3. if "end-pattern" is a number, then the "end-pattern" is generated dynamically from the respective "start-pattern" match group (if start-pattern is a regex)
    4. "escaped-block" type is a "block" which can contain its "end-pattern" if it is escaped, "strings" are classic examples
    5. "block", "comment", "escaped-block" can span multiple lines by default, setting the "multiline": false option can alter this
    6. "escaped-block" by default uses the "\\" escape character, setting the "escape": escChar option, can alter this
    7. "comment" type is a "block" type with the additional semantic information that token is about comments, so comment toggle functionality can be enabled
    8. "comment" type can be interleaved inside other syntax sequences automatically by the parser ("interleave": true, token option) (the comment token should still be added in grammar.Parser part ), else comment interleaving could be handled manually in the grammar.Syntax part

###Syntax model (optional)

Grammar.Syntax model defines the mapping of token context-specific sequences to an associated tokensequenceID and is a map of the form:

__tokensequenceID__  -> __token sequence configuration__


* Inside the Syntax model, tokens can also be defined (similar to Lex part), however it is recommended tokens be defined in Lex part
* Syntax includes 2 types of special patterns ( like generalised regular expressions for complex token sequences )
* Syntax groups are syntax tokens with type "group", these tokens contain sequences of subtokens to be matched according to some scheme
* "group" tokens match types can be :
    1. "match": [min, max], match any of the tokens a minimum min times and a maximum max times else error (analogous to a regex: (t1|t2|t3..){min, max}, where t1, t2, etc are complex tokens in themeselves )
    2. "match": "zeroOrMore",  match any of the tokens zero or more times (analogous to a regex: (t1|t2|t3..)*, where t1, t2, etc are complex tokens in themeselves )
    3. "match": "zeroOrOne":  match any of the tokens zero or one times (analogous to a regex: (t1|t2|t3..)?, where t1, t2, etc are complex tokens in themeselves )
    4. "match": "oneOrMore":  match any of the tokens one or more times (analogous to a regex: (t1|t2|t3..)+, where t1, t2, etc are complex tokens in themeselves )
    5. "match": "either":  match any of the tokens one time (analogous to a regex: (t1|t2|t3..), where t1, t2, etc are complex tokens in themeselves )
    6. "match": "all":  match the tokens in sequence (analogous to a regex: (t1 t2 t3 ..), where t1, t2, etc are complex tokens in themeselves )
* a syntax token can contain (direct or indirect) recursive references to itself ( __note:__ some rule factoring may be needed, to avoid grammar "left-recursion" or ambiguity )
* a "ngram" or "n-gram" syntax token type, is similar to a "group" type, with the difference that it is only matched optionally (suitable to be used in grammar.Parser part)
* It is recommended to have only Lex.tokens or Syntax.ngrams in ther grammar.Parser part and not Syntax.group tokens which are mostly auxilliary
* The grammar.Syntax part is quite general and flexible and can define a complete language grammar, however since this is for syntax highlighting and not for code generation, defining only necessary syntax chunks can be lighter

###Parser

Grammar.Parser defines what to parse and in what order ( only patterns defined in this part of the grammar will actually be parsed, everything else is auxilliary )

