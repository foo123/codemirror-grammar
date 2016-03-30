@echo off

REM git submodule add https://github.com/foo123/editor-grammar

REM bring editor-grammar git submodule up-to-date
cd editor-grammar
git fetch
git merge origin/master
cd ..