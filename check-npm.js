if (process.env.npm_config_user_agent && process.env.npm_config_user_agent.startsWith('npm/')) {
    console.error('\n\x1b[31mError: You must use yarn to install dependencies in this project.\x1b[0m\n');
    console.error('Please run `yarn install` instead.\n');
    process.exit(1);
}
