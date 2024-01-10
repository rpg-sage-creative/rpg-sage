#!/bin/bash

[ -d "./scripts" ] || cd ..

NOW=`date '+%F-%H%M'`
FILE="./dist/version.txt"

# old
eval "echo 'VERSION' > $FILE"
eval "echo 'v1.?.?' >> $FILE"
eval "echo '' >> $FILE"

# new
eval "echo 'DATE' > $FILE"
eval "echo '$NOW' >> $FILE"
eval "echo '' >> $FILE"
eval "echo 'BRANCH' >> $FILE"
eval "git branch --show-current >> $FILE"
eval "echo '' >> $FILE"
eval "echo 'COMMIT' >> $FILE"
eval "git log -n 1 --pretty=oneline >> $FILE"
