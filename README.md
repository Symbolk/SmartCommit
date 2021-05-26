
<div align="center">
  <a href="" target="_blank">
    <img width="160" src="https://github.com/Symbolk/SmartCommit/blob/master/assets/icon.png" alt="logo">
  </a>
  <h1 id="smartcommit"><a href="" target="_blank">SmartCommit</a></h1>

</div>

> Note that this repo just serves as a demo GUI with maintenance suspend, SmartCommit-UI privately lives as a proprietary industrial project inside company since 2020.

#### SmartCommit aims at making "code commit" an elegant and decent daily work for developers.

As advocated by many communities (e.g., [Git official doc], [Angular contribution instructions]) and companies (e.g., [Google's engineering practices]), developers are encouraged to submit cohesive and self-contained commits, accompanying with clear and informative commit messages. 

SmartCommit is the assistant for you to follow this best practice. 

Specifically, it helps you to:

- Organize your local changes into groups, each of which is expected to focus on one specific task.
- Review and stage fine-grained code changes within an intuitive GUI, in the forms of code hunks or files.
- Commit and push multiple commits with one single click, saving the effort to type `git-status`, `git-diff`, `git-add`, `git-commit` and `git-push` commands.

[Git official doc]: https://git-scm.com/docs/gitworkflows#_separate_changes
[Angular contribution instructions]:  https://github.com/angular/angular/blob/master/CONTRIBUTING.md
[Google's engineering practices]: https://github.com/google/eng-practices/blob/master/review/developer/small-cls.md

This repo is the frontend GUI client of SmartCommit, check the [SmartCommitCore] repo for the change decomposition suggestion algorithm.

[SmartCommitCore]: https://github.com/Symbolk/SmartCommitCore

---
## Features

- Commit local code changes in task-oriented groups
- Diff&Compare diff code side by side or line by line
- Push to the remote host platform (GitHub, GitLab, etc.)
- Suggest key words or pharses for the commit message (doing)
- Allow for customizable template for commit message (doing)
  
---

## As a User

> Currently the release binary only supports Windows 10(x64), Linux and macOS version requires signing and will be considered in the future.

### Requirements

- Windows 10(x64)
- Git ^2.18.0   

### Installation

#### Installer Version
1. Download the latest release installer `SmartCommit-Setup-x.y.z.exe` from https://github.com/Symbolk/SmartCommit/releases/latest ;
2. Double click it to install on your machine;
> Security software like 360 may report warnings, it is safe to ignore.
3. Choose&**Copy** the path to install it;
> After the installation, better not choose to directly run it, see the following Usage.
4. Append the path to `PATH` of your environment variable.

#### Portable Version
1. Download the latest release portable package `SmartCommit-Portable-x.y.z.zip` from https://github.com/Symbolk/SmartCommit/releases/latest ;
2. Unzip the zip package to a folder, **copy** the path of this folder, in which you can find the file `SmartCommit.exe`;
3. Append the path to `PATH` of your environment variable.

### Usage:

When you have some changes to commit:

1. Open the terminal (CMD or Git-bash), `cd` to the git repo directory;
2. Type the command `git sc` then you are ready to go!
> In case of error: `git: 'sc' is not a git command. See 'git --help'.`
> This is because the `PATH` environment variable is not reloaded, please restart the terminal after 3 mins or so.

## Screenshots

##### Repo status
![status](/screenshots/status.png?raw=true "status")

##### Side by side diff
![side_diff](/screenshots/side_diff.png?raw=true "side_diff")

##### Inline diff
![inline_diff](/screenshots/inline_diff.png?raw=true "inline_diff")

##### Commit
![commit](/screenshots/commit.png?raw=true "commit")

##### Push
![push](/screenshots/push.png?raw=true "push")
![push_ok](/screenshots/push_ok.png?raw=true "push_ok")

---

## As a Developer

### Requirements

- Windows/macOS/Linux
- Git ^2.18.0   
- Node.js ^v10.16.0
- Python ^2.7.18
- Yarn ~v1.16.0
- Vue-cli ~v3.8.4

### Setup

1. Run the following command under the root directory of the cloned repo to install dependencies:

```
yarn install
```
2. Compiles and hot-reloads for development:

```
yarn electron:serve
```

3. [OR] Build the executable for production:

```
yarn electron:build
```

## Project Infrastructure

SmartCommit is powered by multiple nice open source projects. Thanks for all the open-sourcers!

| Module       | Component              | Version |
| ------------ | --------------------- | -------------------- |
| Framework| [Electron] | ^5.0.12 |
| Frontend| [Vue] | ^2.6.10 |
| Backend | NodeJS | ^10.16.0 |
| Scaffold| [vue-smooth-dnd] | ^0.8.0 |
| UI | [bootstrap-vue] | ^2.0.0-rc.24 |
| Modal | [sweet-modal-vue] | ^2.0.0 |
| Icon | [vue-awesome] | ^3.5.4 |
| Git Function | [git-js] | ^1.118.0 |
| Diff View | [vue-monaco] | ^1.0.1|
| Language Detector | [language-detect] | ^1.1.0 |
| Git Graph | [gitgraph.js] | ^1.3.0 |
| Splash Screen | [electron-splashscreen] | ^0.3.4 |

[Vue]: https://github.com/vuejs/vue
[bootstrap-vue]: https://github.com/bootstrap-vue/bootstrap-vue
[Electron]: https://github.com/electron/electron
[vue-monaco]: https://github.com/egoist/vue-monaco
[language-detect]: https://github.com/blakeembrey/node-language-detect
[sweet-modal-vue]: https://github.com/adeptoas/sweet-modal-vue
[vue-awesome]: https://github.com/Justineo/vue-awesome
[vue-smooth-dnd]: https://github.com/kutlugsahin/vue-smooth-dnd
[git-js]: https://github.com/steveukx/git-js
[gitgraph.js]: https://github.com/nicoespeon/gitgraph.js
[electron-splashscreen]: https://github.com/trodi/electron-splashscreen


## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2019-present, Symbolk
