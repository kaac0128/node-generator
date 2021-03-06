#!/usr/bin/env node

//los imports
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const shell = require('shell');
const chalk = require('chalk');

const render = require('./utils/templates').render;

//obtenemos las opciones de los template

const TEMPLATE_OPTIONS = fs.readdirSync(path.join(__dirname, 'templates'));

const QUESTIONS = [
	{
		name: 'template',
		type: 'list',
		message: '¿Que tipo de proyecto quieres genera?',
		choices: TEMPLATE_OPTIONS	
	},
	{
		name: 'proyecto',
		type: 'input',
		message: '¿Cual es el nombre del proyecto?',
		validate: function(input){
			if(/^([a-z@]{1}[a-z\-\.\\\/0-9]{0,213})+$/.test(input)){
				return true;
			}

			return 'El nombre del proyecto solo puede tener 214 caracteres y tiene que empezar en minuscula o con un @'
		}
	}

];

const DIR_ACTUAL = process.cwd();

inquirer.prompt(QUESTIONS).then(respuestas => {
	const template = respuestas['template'];
	const proyecto = respuestas['proyecto'];

	const templatePath = path.join(__dirname, 'templates', template);
	const pathTarget = path.join(DIR_ACTUAL, proyecto);

	if (!createProject(pathTarget)) return;
	createDirectoriesFilesContent(templatePath, proyecto);

	postProccess(templatePath, pathTarget)
});

function createProject(projectPath){
	if(fs.existsSync(projectPath)){
		console.log(chalk.red('No se pueded crear este proyecto por que el nombre ya se esta usando'));
		return false;
	}

	fs.mkdirSync(projectPath);
	return true;
}

function createDirectoriesFilesContent(templatePath, projectName){
	const listFileDirectories = fs.readdirSync(templatePath);
	listFileDirectories.forEach(item => {
		const originalPath = path.join(templatePath, item);

		const stats = fs.statSync(originalPath);

		const writePath =  path.join(DIR_ACTUAL, projectName, item);

		if(stats.isFile()){
			let contents = fs.readFileSync(originalPath, 'utf-8');

			contents = render(contents, {projectName});
			fs.writeFileSync(writePath, contents, 'utf-8');

			const CREATED = chalk.green('CREATE ');
			const size = stats['size'];
			console.log(`${CREATED} ${originalPath} (${size} bytes)`);
		}else if(stats.isDirectory()){
			fs.mkdirSync(writePath);
			createDirectoriesFilesContent(path.join(templatePath, item), path.join(projectName, item));
		}
	})
}

function postProccess(templatePath, targetPath){
	const isNode = fs.existsSync(path.join(templatePath, 'package.json'));

	if(isNode){
    	exec = require('child_process').exec;
		console.log(chalk.green(`Instalando las dependencias en ${targetPath}`));
		const result = exec('npm install',{cwd: targetPath}, function(err, stdout, stderr) {
			console.log(stdout);
		});
		if(result.code != 0){
			return false;
		}
	}
}