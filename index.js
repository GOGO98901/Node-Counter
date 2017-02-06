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

var gitignore = undefined;
var gitignorePath = path.join(start, '.gitignore');
if (fs.existsSync(gitignorePath) && !program.nogitignore) {
    gitignore = parser.compile(fs.readFileSync(gitignorePath, 'utf8'));
    console.log('Filtering using .gitignore');
}

var ignoreDir = ['node_modules', '.git'];

function ignoreContains(folder) {
    var i = ignoreDir.length;
    while (i--) {
        if (ignoreDir[i] === folder) return true;
    }
    return false;
}

var extensions = {
    'asm': 'Assembly',
    'brs': 'Brightscript',
    'bat': 'Batch', 'cmd': 'Batch',
    'c': 'C / C++',
    'cc': 'C / C++',
    'clj': 'Clojure',
    'cljs': 'Clojure',
    'coffee': 'CoffeeScript',
    'cpp': 'C / C++',
    'cr': 'Crystal',
    'cs': 'C#',
    'css': 'CSS',
    'cxx': 'C / C++',
    'dart': 'Dart',
    'erl': 'Erlang',
    'go': 'Go',
    'groovy': 'Groovy',
    'gs': 'JavaScript',
    'h': 'C / C++',
    'handlebars': 'Handlebars', 'hbs': 'Handlebars',
    'hpp': 'C / C++',
    'hr': undefined,
    'hs': 'Haskell',
    'html':'HTML', 'htm': 'HTML',
    'hx': 'Haxe',
    'hxx': 'C / C++',
    'hy': 'Hy',
    'iced': 'CoffeeScript',
    'ino': undefined,
    'jade': 'Jade',
    'java': 'Java',
    'jl': 'Julia',
    'js': 'Java Script',
    'jsx': 'JSX',
    'kt': 'Kotlin',
    'kts': 'Kotlin',
    'less': 'CSS',
    'lua': 'Lua',
    'ls': 'LiveScript',
    'ml': 'OCaml',
    'mli': 'OCaml',
    'mochi': 'Mochi',
    'monkey': 'Monkey',
    'mustache': 'HTML',
    'nix': 'Nix',
    'nim': 'Nim',
    'nut': 'Squirrel',
    'php': 'PHP', 'php5': 'PHP',
    'pl': 'Perl 5',
    'py': 'Python',
    'r': 'R',
    'rb': 'Ruby',
    'rkt': 'Racket',
    'rs': 'Rust',
    'sass': 'CSS',
    'scala': 'Scala',
    'scss': 'CSS',
    'sh': 'Shell',
    'styl': 'CSS',
    'svg': 'SVG',
    'swift': 'Swift',
    'ts': 'Typescript',
    'tsx': 'Typescript',
    'vb': 'Visual Basic',
    'xml': 'XML',
    'yaml': 'Yaml',
    'm': 'Objective-C / Objective-C++',
    'mm': 'Objective-C / Objective-C++'
}

function extensionsContains(extension) {
    return extension in extensions;
}

function combine(data1, data2) {
    var result = {};
    for (var key in data1) result[key] = data1[key];
    for (var key in data2) {
        if (key in result) {
            if (typeof result[key] == 'number') result[key] += data2[key];
        } else result[key] = data2[key];
    }
    return result;
}

function scan(current, callback) {
    var cFiles = 0, cFolders = 0, cLines = 0, languages = {};

    if (program.output) console.log(' dir > %s', chalk.gray(current));

    var files = fs.readdirSync(current);
    if (gitignore != undefined) files = files.filter(gitignore.accepts);

    files.forEach(next => {
        if (ignoreContains(next)) return;
        // if (next === '.git') return;
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
                    Object.keys(data.languages).forEach(function(key) {
                        var val = data.languages[key];
                        if (!(key in languages)) languages[key] = { 'lines': 0, 'whitespace': 0 };

                        var combined = combine(languages[key], val);
                        languages[key] = combined;
                    });
                });
            } else if (stat.isFile()) {
                var file = next.split('/').pop();
                var ext = file.split('.').pop();
                if (extensionsContains(ext)) {
                    cFiles++;
                    read(next, function(data) {
                        cLines += data.lines;
                        if (!(ext in languages)) languages[ext] = { 'lines': 0, 'whitespace': 0 };
                        languages[ext] = combine(languages[ext], {
                            'lines': data.lines,
                            'whitespace': data.whitespace
                        });
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
    var lines = 0, white = 0;
    try {
        var contents = fs.readFileSync(file, 'utf8');

        // lines = contents.split(endOfLine).length;

        contents.split(endOfLine).forEach((line) => {
            lines ++;
            if (line.length === 0) white ++;
        });

        if (program.output) console.log('file > %s %s line(s)', chalk.cyan(file), lines);
    } catch (e) {
        lines = 0;
        console.error(chalk.red('file > %s ' + chalk.red('failed to read')), chalk.gray(file));
        if (program.output) console.error(chalk.red(e));
    }
    callback({
        'lines': lines,
        'whitespace': white
    });
}

console.log('Scanning \'%s\'', start);
scan(start, function(data) {
    try {
        console.log();
        console.log('Folders Scanned: %s', data.folders);
        console.log('     Files Read: %s', data.files);
        console.log('    Total Lines: %s', data.lines);
        var percent = 0;

        var langData = [];
        for (var lang in data.languages) {
            var outData = {};
            outData.language = extensions[lang];
            if (outData.language == undefined) outData.extention = lang;
            outData.lines = data.languages[lang].lines;
            outData.whitesapce = chalk.gray(data.languages[lang].whitespace);
            //outData.percent = ((data.languages[lang].lines / data.lines) * 100).toFixed(3) + '%';
            var index = -1;
            langData.forEach(function (item) {
                if (item.language == outData.language) {
                    index = langData.indexOf(item);
                    outData = combine(item, outData);
                    return;
                }
            });
            if (index >= 0) {
                langData[index] = outData;
            } else langData.push(outData);
        }
        langData.forEach(function (item) {
            item.percent = ((item.lines / data.lines) * 100).toFixed(3) + '%';
        });

        var columns = columnify(langData, {
            minWidth: 20,
            config: {
                description: {maxWidth: 30}
            }
        });
        console.log();
        console.log(columns)

    } catch(e) {
        console.error(e);
    }
});
