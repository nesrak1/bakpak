@echo off
java -jar ../cc.jar --compilation_level ADVANCED_OPTIMIZATIONS --language_in="ECMASCRIPT_2017" --language_out="ECMASCRIPT_2017" --js data.js --js toneplay2.js --js engine.js --js bakpak.js --js_output_file scc.js
pause
advzip -a scc.zip -4 -i 10000 scc.js