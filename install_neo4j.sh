#!/bin/sh

VERSION="3.1.3"
TARBALL="neo4j3.1.3.tar.gz"

cd /tmp
wget -O $TARBALL "http://dist.neo4j.org/neo4j-community-$VERSION-unix.tar.gz?edition=community&version=$VERSION&distribution=tarball&dlid=2803678"
tar zxf $TARBALL

cd "neo4j-community-$VERSION"

./bin/neo4j-admin set-initial-password "1234"

./bin/neo4j start
sleep 5

