@echo off

REM bring editor-grammar git submodule up-to-date
cd editor-grammar
git fetch
git merge origin/master
cd ..