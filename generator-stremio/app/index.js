var generators = require('yeoman-generator');
var _ = require('lodash');

module.exports = generators.Base.extend({
    prompting: {
        askForName: askForName,
        askForShorthandName: askForShorthandName,
        askForIdProperty: askForIdProperty,
        askForEmail: askForEmail,
        askForTypes: askForTypes,
        askForBackground: askForBackground,
        askForIcon: askForIcon,
        askForDescription: askForDescription
    },
    writing: function () {
        var self = this;
        self.types = self.types.map(function(x){
            return '"' + x + '"';
        });
        this.fs.copyTpl(
            this.templatePath('index.js.tpl'),
            this.destinationPath('output/index.js'),{ 
                id: self.id,
                name: self.name,
                description: self.description,
                icon: self.icon,
                background: self.background,
                idProperty: "[" + self.idProperty.join(",") + "]",
                types: "[" + self.types.join(",") + "]"
            }
        );

        this.fs.copyTpl(
            this.templatePath('package.json.tpl'),
            this.destinationPath('output/package.json'),{ 
                id: self.id,
                description: self.description,
                email: self.email
            }
        );
    },
    end: function(){
        this.log('Add-on files are generated and you can find them in `output` directory. You should now edit `output/index.js` file.')
    }
});

function askForName() {
    return this.prompt({
        type: 'input',
        name: 'name',
        message: 'Add-on name:'
    }).then(function (answers) {
        _.extend(this, answers);
    }.bind(this))
}

function askForShorthandName() {
    return this.prompt({
        type: 'input',
        name: 'id',
        message: 'Shorthand name:',
        validate: function (answer) {
            if (!(/^[a-z]+$/).test(answer)) {
                return "only lowercase (no whitespace, no numbers)";
            }
            return true;
        }
    }).then(function (answers) {
        _.extend(this, answers);
    }.bind(this))
}

var idProperties = [];
function askForIdProperty(cb){

        var done = this.async();

        return this.prompt({
            type: 'input',
            name: 'idProperty',
            message: 'Add-on data identifiers (Leave blank to continue):',
            validate: function(answer){
                if(answer && !/^[a-zA-Z_]+$/.test(answer)){
                    return "no numbers, no whitespaces"
                }
                return true;
            }
        }).then(function(answers){
            if(answers.idProperty){
                idProperties.push("'" + answers.idProperty + "'");
                askForIdProperty.call(this, done);
            }
            else{
                this.idProperty = idProperties;
                cb();
            }
        }.bind(this))
}

function askForEmail() {
    return this.prompt({
        type: 'input',
        name: 'email',
        message: 'Your email address:',
        validate: function (answer) {
            var re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
            if (!re.test(answer)) {
                return "not valid email address";
            }
            return true;
        }
    }).then(function (answer) {
        _.extend(this, answer);
    }.bind(this))
}
function askForTypes(){
    return this.prompt({
        type: 'checkbox',
        name: 'types',
        message: 'Choose content types your addon will support:)',
        choices: ['movie', 'series', 'tv', 'channel'],
        validate: function(answers){
            return answers.length > 0
        }
    }).then(function(answers) {
        _.extend(this, answers);
    }.bind(this))
}

function askForBackground() {
    return this.prompt({
        type: 'input',
        name: 'background',
        message: 'Background image (URL to 1366x756 png background):'
    }).then(function (answer) {
        _.extend(this, answer);
    }.bind(this))
}
function askForIcon() {
    return this.prompt({
        type: 'input',
        name: 'icon',
        message: 'Icon (URL to 256x256 monochrome png icon):'
    }).then(function(answer){
        _.extend(this, answer);
    }.bind(this))
}
function askForDescription() {
    return this.prompt({
        type: 'input',
        name: 'description',
        message: 'Description'
    }).then(function (answers) {
        _.extend(this, answers);
    }.bind(this))
}