var generators = require('yeoman-generator');
var _ = require('lodash');

module.exports = generators.Base.extend({
    prompting: function(){
        return this.prompt([{
            type: 'input',
            name: 'name',
            message: 'Add-on name',
        },
        {
            type: 'input',
            name: 'id',
            message: 'Identifier (lowercase, alphanumeric, no whitespaces)'
        },
        {
            type: 'input',
            name: 'email',
            message: 'Your email (used for contact)'
        },
        {
            type: 'checkbox',
            name: 'types',
            message: 'Choose content types your addon will support:)',
            choices: ['movie', 'series', 'tv', 'channel']
        },
        {
            type: 'input',
            name: 'email',
            message: 'Your email (used for contact)'
        },
        {
            type: 'input',
            name: 'background',
            message: 'Background image (URL to 1366x756 png background)'
        },
        {
            type: 'input',
            name: 'icon',
            message: 'Icon (URL to 256x256 monochrome png icon)'
        },
        {
            type: 'input',
            name: 'description',
            message: 'Description'
        }]).then(function(answers){
            _.extend(this, answers);
        }.bind(this))
    },
    writing: function () {
        var self = this;
        self.types = self.types.map(function(x){
            return '"' + x + '"';
        })
        this.fs.copyTpl(
            this.templatePath('index.js.tpl'),
            this.destinationPath('output/index.js'),{ 
                id: self.id,
                name: self.name,
                description: self.description,
                icon: self.icon,
                background: self.background,
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
    }
});
