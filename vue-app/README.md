# <center>SmartCommit</center>

#### SmartCommit makes committing code in git both an elegant and decent daily work.

Many developers are used to add all changed files to stage together and commit once, though multiple tasks might have been done. It is no good practice, saving time to type dozens of git commands but bringing trouble to the code review, continuous integration, reverting and cherry-picking. 

Community encourages developers to submit self-contained and focused commits, with clear and decent commit messages. That's exactly what SmartCommit tries to do, by taking the work of `git-diff`, `git-add`, `git-commit` commands. 

---
## As a User

### Installation

> Currently the app only support Windows x64, Linux and macOS will be supported pretty soon :-)

1. Download the latest release zip package;
2. Unzip the zip package to a folder, copy the path of this folder, which contains the file SmartCommit.exe;
3. Append the path to PATH of your environment variable.

### Usage:

1. Open CMD or Git-bash, switch to any git project;
2. Do some development work as you always do;
3. When you want to commit, type the command `git sc` then you are ready to go!

---

## As a Developer

### Project setup

```

yarn install

```

### Compiles and hot-reloads for development

```

yarn run electron:serve

```

### [OR] Build the executable for production

```

yarn run electron:build

```

## Project Infrastructure

SmartCommit is powered by multiple nice open source projects.

| Module       | Component              | Version |
| ------------ | --------------------- | -------------------- |
| Frontend| [Vue] | ^2.6.10 |
| Scaffold| [vue-smooth-dnd] | ^0.8.0 |
| UI | [bootstrap-vue] | ^2.0.0-rc.24 |
| Modal | [sweet-modal-vue] | ^2.0.0 |
| Icon | [vue-awesome] | ^3.5.4 |
| App Framework| [Electron] | ^5.0.0 |
| Git Function | [git-js] | ^1.118.0 |
| Diff View | [vue-monaco] | ^1.0.1|
| Language Detector | [language-detect] | ^1.1.0 |

[Vue]: https://github.com/vuejs/vue
[bootstrap-vue]: https://github.com/bootstrap-vue/bootstrap-vue
[Electron]: https://github.com/electron/electron
[vue-monaco]: https://github.com/egoist/vue-monaco
[language-detect]: https://github.com/blakeembrey/node-language-detect
[sweet-modal-vue]: https://github.com/adeptoas/sweet-modal-vue
[vue-awesome]: https://github.com/Justineo/vue-awesome
[vue-smooth-dnd]: https://github.com/kutlugsahin/vue-smooth-dnd
[git-js]: https://github.com/steveukx/git-js


## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2019-present, Symbolk
