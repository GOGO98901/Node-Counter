#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var pkg = require(path.join(__dirname, 'package.json'));
var chalk = require('chalk');
var parser = require('gitignore-parser');
var columnify = require('columnify')
var endOfLine = require('os').EOL;

var program = require('commander');
program.version(pkg.version).description(pkg.description)
    .arguments('[filterRegex...]')
    .option('-d, --directory <path>', 'The directory to start the scan')
    .option('-g, --nogitignore', 'Turns off the ability to use gitignore (on by default)')
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

console.log(program.args);

var gitignore = undefined;
var gitignorePath = path.join(start, '.gitignore');
if (fs.existsSync(gitignorePath) && !program.nogitignore) {
    gitignore = parser.compile(fs.readFileSync(gitignorePath, 'utf8'));
    console.log('Filtering using .gitignore');
}

var extensions = [
    "asm",
    "brs",
    "bat", "cmd",
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
    "sh",
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

function combine(data1, data2) {
    var result = {};
    for (var key in data1) result[key] = data1[key];
    for (var key in data2) {
        if (key in result) result[key] += data2[key];
        else result[key] = data2[key];

    }
    return result;
}

function scan(current, callback) {
    var cFiles = 0, cFolders = 0, cLines = 0, languages = {};

    if (program.output) console.log(' dir > %s', chalk.gray(current));

    var files = fs.readdirSync(current);
    if (gitignore != undefined) files = files.filter(gitignore.accepts);

    files.forEach(next => {
        if (next === '.git') return;
        var next = path.join(current, next);
        if (program.args != undefined) if (program.args.length > 0) {
            var match = false;
            program.args.forEach(arg => {
                if (next.match(arg) != null) match = true;
                if (match) return;
            });
            if (match) {
                if (program.output) console.log('skip > %s', chalk.red(next));
                return;
            }
        }
        if (fs.existsSync(next)) {
            var stat = fs.lstatSync(next);
            if (stat.isDirectory()) {
                cFolders++;
                scan(next, function(data) {
                    cFiles += data.files;
                    cFolders += data.folders;
                    cLines += data.lines;
                    languages = combine(languages, data.languages);
                });
            } else if (stat.isFile()) {
                var file = next.split('/').pop();
                var ext = file.split('.').pop();
                if (extensionsContains(ext)) {
                    cFiles++;
                    read(next, function(data) {
                        cLines += data.lines;
                        if (ext in languages) languages[ext] += data.lines;
                        else languages[ext] = data.lines;
                    });
                }
            }
        }
    });
    callback({
        'files': cFiles,
        'folders': cFolders,
        'lines': cLines,
        'languages': languages
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

        if (program.output) console.log('file > %s %s line(s)', chalk.cyan(file), lines);
    } catch (e) {
        lines = 0;
        console.error(chalk.red('file > %s ' + chalk.red('failed to read')), chalk.gray(file));
        if (program.output) console.error(chalk.red(e));
    }
    callback({
        'lines': lines
    });
}

console.log('Scanning \'%s\'', start);
scan(start, function(data) {
    console.log();
    console.log('Folders Scanned: %s', data.folders);
    console.log('     Files Read: %s', data.files);
    console.log('    Total Lines: %s', data.lines);
    var percent = 0;

    var langData = [];
    for (var lang in data.languages) {
        var outData = {};
        outData.extention = lang;
        outData.lines = data.languages[lang];
        outData.percent = ((data.languages[lang] / data.lines) * 100).toFixed(3) + '%';
        langData.push(outData);
    }

    var columns = columnify(langData, {
        minWidth: 20,
        config: {
            description: {maxWidth: 30}
        }
    });
    console.log();
    console.log(columns)
});
