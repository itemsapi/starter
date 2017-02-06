### Upgrade project

At the moment there is no script for automatic upgrade.

To upgrade it manually: 
- It is recommended to install software like https://www.gitkraken.com/
- You can also upgrade that manually by CLI

List your repositories:
- `git remote -v`

Add starter as your remote repository:
- `git remote add starter git@github.com:itemsapi/starter.git`

After that, fetch your new repository and merge with master. There is a high chance you will need to resolve conflicts.

If you merge your current repo with starter, don't forget:
- `npm install`

More info here:
http://stackoverflow.com/questions/244695/how-to-combine-two-branches-from-two-different-repositories-in-a-single-reposito
