# bakpak js13k 2019

this is my js13k entry for 2019 where you find attachments for your backpack to solve puzzles and defeat bosses. it is running on the chiisai engine made for last year.

info dump:

* scenes and models are built with magicavoxel. drag and drop a vox file onto dragndrop.bat in the models folder to generate a model (or a scene if multiple objects are in the vox file).

* music is generated from orgmaker. the modified orgmaker can be found in the toneplay folder. simply drag and drop an org file onto the toneplayorg program to generate a music file. if there are any issues (invalid instruments) the program will close instantly. make sure to run the program from the command line to catch these errors.

* images are made from svgs. its a bit of a hastle but if you're using inkscape, make sure you use regular positions rather than matrix transforms. there's not really a good way to do it. use svgcompress in the models folder to convert svgs to the image format.

* to compile, make sure you have closure compiler in the root directory named "cc.jar" and run build.bat in the game folder. the generated assets go into the data.js file in the game folder. the engine runs in engine.js while the game scripts go in bakpak.js.
