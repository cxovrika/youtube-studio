# Use node version 15, should be just fine
FROM node:15

# Set working directory variable for application
ENV WORKDIR /app

# Specify working directory
WORKDIR /${WORKDIR}

# Copy project files (make sure node_modules are not copied)
COPY . .

# Install dependencies
RUN npm install --loglevel verbose

# Run the script
ENTRYPOINT ["node", "set-endscreen.js"]