const FLOW_TYPES = {
  USER_INPUT: {
    type: "userInput",
    description: "Collect input from the user",
    parameters: {
      prompt: {
        type: "string",
        description: "Question or instruction to show the user",
      },
      variableName: {
        type: "string",
        description: "Variable to store the user's input",
      },
      defaultValue: {
        type: "string",
        description: "Default value if no input is provided",
      },
    },
  },
  SET_VARIABLE: {
    type: "setVariable",
    description: "Set or transform a variable value",
    parameters: {
      variableName: { type: "string", description: "Variable name to assign" },
      value: {
        type: "string",
        description: "Value to assign (supports ${varName} templates)",
      },
    },
  },
  START: {
    type: "start",
    description: "Initialize flow variables",
    parameters: {
      variables: {
        type: "array",
        description: "List of variables to initialize",
      },
    },
  },
  API_CALL: {
    type: "apiCall",
    description: "Make an HTTP request to an API endpoint",
    parameters: {
      url: { type: "string", description: "The URL to make the request to" },
      method: { type: "string", description: "HTTP method (GET, POST, etc.)" },
      headers: {
        type: "array",
        description: "Request headers as key-value pairs",
      },
      bodyType: {
        type: "string",
        description: "Type of request body (json, form)",
      },
      body: {
        type: "string",
        description:
          "Request body content. If body type is json, always return a valid json object. If body type is form, always return a valid form data object.",
      },
      formData: { type: "array", description: "Form data as key-value pairs" },
      resultVariable: {
        type: "string",
        description: "Variable to store the response",
      },
      directOutput: {
        type: "boolean",
        description:
          "Whether to return the response directly to the user without LLM processing",
      },
    },
    examples: [
      {
        url: "https://api.example.com/data",
        method: "GET",
        headers: [{ key: "Authorization", value: "Bearer 1234567890" }],
      },
    ],
  },
  GENERATE: {
    type: "generate",
    description: "Process data using LLM instructions",
    parameters: {
      instruction: {
        type: "string",
        description: "The instruction for the LLM to follow",
      },
      systemPrompt: {
        type: "string",
        description: "Optional system prompt to set context for the LLM",
      },
      provider: {
        type: "string",
        description:
          "Optional provider override (e.g. anthropic, openai, gemini, ollama). Uses system default if not set.",
      },
      model: {
        type: "string",
        description:
          "Optional model override (e.g. claude-sonnet-4-6). Uses system default if not set.",
      },
      resultVariable: {
        type: "string",
        description: "Variable to store the processed result",
      },
    },
  },
  WEB_SCRAPING: {
    type: "webScraping",
    description: "Scrape content from a webpage",
    parameters: {
      url: {
        type: "string",
        description: "The URL of the webpage to scrape",
      },
      resultVariable: {
        type: "string",
        description: "Variable to store the scraped content",
      },
      directOutput: {
        type: "boolean",
        description:
          "Whether to return the scraped content directly to the user without LLM processing",
      },
    },
  },
  CODE: {
    type: "code",
    description: "Execute JavaScript code to transform data",
    parameters: {
      code: {
        type: "string",
        description: "JavaScript code to execute. Use `variables` object to read/write flow variables. Return a value to store as result.",
      },
      resultVariable: {
        type: "string",
        description: "Variable to store the execution result",
      },
    },
  },
};

module.exports.FLOW_TYPES = FLOW_TYPES;
