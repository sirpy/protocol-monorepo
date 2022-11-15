#!/bin/bash -eux

# suggested command for verifying all networks (assuming the existence of a file "testnets" with a list of canonical names):
# for m in `cat testnets`; do echo $m && RELEASE_VERSION=v1 scripts/verify-framework.sh $m; done

network=$1
tmpfile=/tmp/sf.$network.addrs

npx truffle exec --network $network scripts/info-print-contract-addresses.js : $tmpfile
tasks/etherscan-verify-framework.sh $network $tmpfile

