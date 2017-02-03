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

var start = process.cwd();
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
                scan(next, function(data) {
                    cFiles += data.files;
                    cFolders += data.folders;
                    cLines += data.lines;
                });
            } else if (stat.isFile()) {
                if (extensionsContains(next.split('.').pop())) {
                    cFiles++;
                    read(next, function(data) {
                        cLines += data.lines;
                    });
                }
            }
        }
    });
    callback({
        'files': cFiles,
        'folders': cFolders,
        'lines': cLines
    });
}

function read(file, callback) {
    var lines = 0;
    try {
        var contents = fs.readFileSync(file, 'utf8');

        lines = contents.split(endOfLine).length;

        // for (String line: contents.split(endOfLine)) {
        //     lines ++;
        // }

        if (program.output) console.log('file > %s %s line(s)', chalk.gray(file), lines);
    } catch (e) {
        lines = 0;
        console.error(chalk.red('file > %s ' + chalk.red('failed to read')), chalk.gray(file));
        if (program.output) console.error(chalk.red(e));
    }
    callback({
        'lines': lines
    });
}

console.log('Scanning %s', start);
scan(start, function(data) {
    console.log(chalk.green('Folders Scanned: %s'), data.folders);
    console.log(chalk.green('Files: %s'), data.files);
    console.log(chalk.green('Lines: %s'), data.lines);
});
