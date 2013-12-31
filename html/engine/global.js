function matchcmd(cmd, cmdlist) {
    var cmd_real = cmd, i, j;
    for (i = 0; i < cmdlist.length; i++) {
        if (typeof cmdlist[i] === 'object') {
            for (j = 0; j < cmdlist[i].length; j++) {
                if (cmdlist[i][j].length >= cmd.length && cmdlist[i][j].substr(0, cmd.length) === cmd.toLowerCase()) {
                    return cmdlist[i][0];
                }
            }
        } else if (cmdlist[i].length >= cmd.length && cmdlist[i].substr(0, cmd.length) === cmd.toLowerCase()) {
            return cmdlist[i];
        }
    }
    return cmd_real;
}
