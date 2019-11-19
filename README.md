# <center>SmartCommit</center>

#### SmartCommit makes committing both an elegant and decent daily work.

As recently suggested in Google's engineering [practices] (2019-9), developers are encouraged to submit cohesive and self-contained commits, with clear and uniform commit messages. That's exactly what SmartCommit tries to do, by firstly taking over the job of `git-status`, `git-diff`, `git-add`, `git-commit` and `git-push` commands. 

[practices]: https://github.com/google/eng-practices/blob/master/review/developer/small-cls.md

To live up to the name, SmartCommit will gradually provide more advanced features to make it a real smart assistant for developers. Suggestions and Issues are welcomed!

---
## Features

- Stage&Commit changes in groups
- Diff&Compare diff code side by side or line by line
- Suggest words for commit message
- Push to the remote
- Customizable template for commit message (developing)

---

## As a User

> Currently the app only support Windows x64, Linux and macOS version will be released when the :-)

### Requirements

- Windows
- Git
- Network access

### Installation

#### Installer
1. Download the latest release installer `SmartCommit-Setup-x.y.z.exe` from https://github.com/Symbolk/SmartCommit/releases/latest ;
2. Double click it to install on your machine;
> Security software like 360 may report warnings, it is safe to ignore.
3. Choose&**Copy** the path to install it;
> After the installation, better not choose to directly run it, see the following Usage.
4. Append the path to `PATH` of your environment variable.

#### Portable
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

- Windows
- Git ^2.18.0
- Node.js ^v10.16.0
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
| Git Graph | [gitgraph.js] | ^1.3.0 |

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


## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2019-present, Symbolk
