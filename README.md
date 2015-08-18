# THE CLUSTERNATOR

## Setup

#### Install the `clusternator` CLI

```
git clone https://github.com/rangle/the-clusternator.git
cd the-clusternator
npm install . -g
```

Check and see if it installed successfully

```
clusternator --help
```


#### Export AWS keys

```
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
```

#### Create app definition file

In your project's root folder:

```
clusternator app:new > YOUR_APP_DEFINITION.json
```


