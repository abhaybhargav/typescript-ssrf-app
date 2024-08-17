# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY *.ts ./
COPY tsconfig.json ./

# Compile TypeScript to JavaScript
RUN npm run build

# Copy views directory
COPY views ./views
COPY views ./dist/views

# Expose the port the app runs on
EXPOSE 8880

# Define the command to run the app
CMD ["node", "dist/app.js"]