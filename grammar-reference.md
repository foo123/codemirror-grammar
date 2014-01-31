##Grammar configuration options


###Extra Settings

* **Grammar.RegExpID** defines the prefix ID for any regular expressions (represented as strings) used in the grammar

The first character after the RegExpID is considered the regular expression delimiter(similar to php regex usage), 
in this way *regular expression flags* can be added (mostly the case-insensitive flag **i** )

example:
```javascript

"RegExpID" : "RegExp::"

// .. various stuff here

"aToken" : "RegExp::/[abc]+/i", // define a regular expression /[abc]+/i, or [abc]+ with case-insensitive flag
// note: the delimiters ( /, / ) are NOT part of the regular expression
// regular expression syntax and escaping is same as regexs defined with new RegExp() object in javascript

"anotherToken" : "RegExp::#[def]+#i", // define a regular expression /[def]+/i, or [def]+ with case-insensitive flag
// note: other delimiters are used ( #, # )

// .. other stuff here

```

* **Grammar.Extra** defines any (editor-specific) extra settings (eg. *electricChars*, *fold*, etc..) to be added to the generated mode, and is a map of the form:

**editorSpecificSettingID**  -> **editorSpecificSettingValue**


###Style model

Grammar.Style model defines the mapping of tokens to editor styles and is a map of the form:

**tokenID**  -> **Editor style tag**


###Lexical model

Grammar.Lex model defines the mapping of token patterns and token configuration to an associated tokenID and is a map of the form:

**tokenID**  -> **token configuration**


**token configuration** can be:

* a pattern or array of patterns
* an object having at least (some or all of) the following *properties* :
    1. "type" : token type (default "simple" )
    2. "tokens": pattern or array of patterns for this token
    3. properties depending on **token type** (see below)

* a token type can be **"simple"** (default), **"indent"** , **"dedent"** , **"comment"** , **"block"** , **"escaped-block"**

**Simple Tokens**

* a literal **null** valued token matches end-of-line (EOL); can be useful in token (syntax) sequences when **EOL** is used as separator
* a literal empty token (  __""__  ) matches **non-space** ; can be useful when multiple tokens should be consecutive with no space between them
* a literal string becomes a token (eg inside Syntax model sequence) with a tokenID same as its literal value
* a token can be defined using just the tokenID and the token pattern(s); token type is assumed **"simple"**
* **multiple "simple" tokens** (which are NOT regular expresions) are grouped into one regular expression by default using **"\\b"** (word-boundary) delimiter; this is usefull for speed fine-tuning the parser, adding the "combine" property in the token configuration, can alter this option, or use a different delimiter
* **"simple" tokens** can also be used to enable *keyword autocomplete functionality* ("autocomplete" : true, option )
* **"simple" tokens** can **push** or **pop** *string IDs* onto the data stack generated from the matched token ( *experimental feature* ), for example *associated tag mathing* can be done this way, (see test/grammars/xml.js for an example)

**Example:**
```javascript

// stuff here..

"openTag" : {
    // this will push a token ID generated from the matched token
    // it pushes the matched tag name (as regex group 1)
    // string replacement codes are similar to javascript's replace function
    "push" : "<$1>",
    "tokens" : "RegExp::#<([a-z]+)>#i"
},

"closeTag" : {
    // this will pop a token ID from the stack
    // and try to match it to the ID generated from this matched token
    // it pops and matches the tag name (as regex group 1)
    // string replacement codes are similar to javascript's replace function
    
    // note 1: the ID has similar format to the previously pushed ID
    // any format can be used as long as it is consistent (so matching will wotk correctly)
    
    // note 2: a "pop" : null or with no value, pops the data unconditionally (can be useful sometimes)
    
    "pop" : "<$1>", 
    "tokens" : "RegExp::#</([a-z]+)>#i"
}

// other stuff here..

```

**Block Tokens**

* **"comment", "block", "escaped-block" token types** take pairs of patterns [start-pattern, end-pattern]
    1. if **"end-pattern"** is missing, **"end-pattern"** is same as **"start-pattern"**
    2. if **"end-pattern"** has the (literal) value **null** , **"end-pattern"** matches **end-of-line** (eg. in single line comment blocks)
    3. if **"end-pattern"** is a **string** , it can contain [special string replacement patterns](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter), the **"end-pattern"** will be generated dynamically from the respective **"start-pattern"** by replacement (provided start-pattern is a regex), make sure to properly escape literal **"$"** values in order to match them correctly (see previous link)
    4. if **"end-pattern"** is a **number** , then the **"end-pattern"** is generated dynamically from the respective **"start-pattern"** match group (provided start-pattern is a regex)
    5. **"escaped-block"** type is a **"block"** which can contain its **"end-pattern"** if it is *escaped* , **"strings"** are classic examples
    6. **"block", "comment", "escaped-block"** can span multiple lines by default, setting the "multiline": false option can alter this
    7. **"escaped-block"** by default uses the **"\\"** escape character, setting the "escape": escChar option, can alter this
    8. **"comment"** type is a **"block"** type with the additional semantic information that token is about comments, so *comment toggle functionality* can be enabled
    9. **"comment"** type can be *interleaved* inside other syntax sequences automatically by the parser ("interleave": true, token option) (the comment token should still be added in grammar.Parser part ), else *comment interleaving could be handled manually* in the **grammar.Syntax** part
    10. **all block-type tokens** can have *different styles* for **block delimiters** and **block interior** (see examples), for example having a block token with ID **"heredoc"** , the interior different style can be represented in **Style** part of grammar as **"heredoc.inside"** (make sure your token IDs do not accidentally match this option)

    
###Syntax model (optional)

Grammar.Syntax model defines the mapping of token context-specific sequences to an associated tokensequenceID and is a map of the form:

**tokensequenceID**  -> **token sequence configuration**


* Inside the **Syntax** model, *(single) tokens* can also be defined (similar to **Lex** part), however it is recommended (single) tokens be defined in **Lex** part
* Syntax includes 2 types of *special patterns/tokens* ( like generalised regular expressions for composite token sequences )
* **Syntax groups** are syntax tokens with type **"group"** ; these tokens contain sequences of subtokens to be matched according to some scheme
* **"group"** tokens **match** types can be :
    1. **"match": [min, max]** , match any of the tokens a minimum min times and a maximum max times else error (analogous to a regex: **(t1 | t2 | t3..){min, max}** , where t1, t2, etc are also composite tokens )
    2. **"match": "zeroOrOne"** :  match any of the tokens zero or one times (analogous to a regex: **(t1 | t2 | t3..)?** , where t1, t2, etc are also composite tokens )
    3. **"match": "zeroOrMore"** ,  match any of the tokens zero or more times (analogous to a regex: __(t1 | t2 | t3..)*__ , where t1, t2, etc are also composite tokens )
    4. **"match": "oneOrMore"** :  match any of the tokens one or more times (analogous to a regex: **(t1 | t2 | t3..)+** , where t1, t2, etc are also composite tokens )
    5. **"match": "either"** :  match any of the tokens (analogous to a regex: **(t1 | t2 | t3..)** , where t1, t2, etc are also composite tokens )
    6. **"match": "all"** :  match all the tokens in sequence (analogous to a regex: **(t1 t2 t3 ..)** , where t1, t2, etc are also composite tokens ) else error
* a syntax token can contain (direct or indirect) *recursive references* to itself ( **note:** some rule factoring may be needed, to avoid grammar "left-recursion" or ambiguity )
* a **"ngram"** or **"n-gram"** syntax token type, is similar to a **"group" , "match":"all" type** , with the difference that it is only matched optionally (suitable to be used in **grammar.Parser** part)
* It is recommended to have only **Lex.tokens** or **Syntax.ngrams** in ther **grammar.Parser** part and not Syntax.group tokens which are mostly *auxilliary*
* The grammar.Syntax part is quite general and flexible and can define a complete language grammar, however since this is for syntax highlighting and not for code generation, defining only necessary syntax chunks can be lighter

###Parser

**Grammar.Parser** defines what to parse and in what order ( **only patterns** defined in this part of the grammar will **actually be parsed** , everything else is *auxilliary* )

