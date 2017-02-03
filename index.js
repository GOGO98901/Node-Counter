#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var pkg = require(path.join(__dirname, 'package.json'));
var chalk = require('chalk');
var parser = require('gitignore-parser');
var endOfLine = require('os').EOL;

var program = require('commander');
program.version(pkg.version)
    .option('-d, --directory <path>', 'The directory to start the scan')
    .option('-o, --output', 'Displays the file currently being read')
    .parse(process.argv);

var start = __dirname;
if (fs.existsSync(program.directory)) {
    start = program.directory;
} else if (program.directory != undefined) {
    console.error(chalk.red('The directory \'%s\' dose not exist'), program.directory);
    program.help();
    process.exit(1);
}

var gitignore = undefined;
if (fs.existsSync('.gitignore')) {
    gitignore = parser.compile(fs.readFileSync('.gitignore', 'utf8'));
    console.log('Filtering using .gitignore');
}

var extensions = [
    "asm",
    "brs",
    "c",
    "cc",
    "clj",
    "cljs",
    "coffee",
    "cpp",
    "cr",
    "cs",
    "css",
    "cxx",
    "dart",
    "erl",
    "go",
    "groovy",
    "gs",
    "h",
    "handlebars", "hbs",
    "hpp",
    "hr",
    "hs",
    "html", "htm",
    "hx",
    "hxx",
    "hy",
    "iced",
    "ino",
    "jade",
    "java",
    "jl",
    "js",
    "jsx",
    "kt",
    "kts",
    "less",
    "lua",
    "ls",
    "ml",
    "mli",
    "mochi",
    "monkey",
    "mustache",
    "nix",
    "nim",
    "nut",
    "php", "php5",
    "pl",
    "py",
    "r",
    "rb",
    "rkt",
    "rs",
    "sass",
    "scala",
    "scss",
    "styl",
    "svg",
    "swift",
    "ts",
    "tsx",
    "vb",
    "xml",
    "yaml",
    "m",
    "mm"
]

function extensionsContains(extention) {
    var i = extensions.length;
    while (i--) {
        if (extensions[i] === extention) return true;
    }
    return false;
}

function scan(current, callback) {
    var cFiles = 0, cFolders = 0, cLines = 0;
    if (program.output) console.log(' dir > %s', chalk.gray(current));
    var files = fs.readdirSync(current);
    if (gitignore != undefined) files = files.filter(gitignore.accepts);
    files.forEach(next => {
        var next = path.join(current, next);
        if (fs.existsSync(next)) {
            var stat = fs.lstatSync(next);
            if (stat.isDirectory()) {
                cFolders++;
                scan(next, function(files, folders, lines) {
                    cFiles += files;
                    cFolders += folders;
                    cLines += lines;
                });
            } else if (stat.isFile()) {
                if (extensionsContains(next.split('.').pop())) {
                    cFiles++;
                    read(next, function(lines) {
                        cLines += lines;
                    });
                }
            }
        }
    });
    callback(cFiles, cFolders, cLines);
}

function read(file, callback) {
    var contents = fs.readFileSync(file, 'utf8');

    var lines = contents.split(endOfLine).length;

    // var lines = 0;
    // for (String line: contents.split(endOfLine)) {
    //     lines ++;
    // }

    if (program.output) console.log('file > %s %s line(s)', chalk.gray(file), lines);
    callback(lines);
}

console.log('Scanning %s', start);
scan(start, function(files, folders, lines) {
    console.log("Folders Scanned: %s", folders);
    console.log("Files: %s", files);
    console.log("Lines: %s", lines);
});
