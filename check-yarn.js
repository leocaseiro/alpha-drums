if (!process.env.npm_config_user_agent?.startsWith('yarn')) {
  console.error('Error: Please use yarn to install dependencies in this project.');
  process.exit(1);
}
