const Core = {
  // Invokes an LLM. Replace with your LLM API call (e.g., OpenAI, local LLM).
  InvokeLLM: async ({
    prompt,
    add_context_from_internet,
    response_json_schema,
    file_urls,
  }) => {
    console.log("Mock InvokeLLM called with:", {
      prompt,
      add_context_from_internet,
      response_json_schema,
      file_urls,
    });
    await new Promise((resolve) => setTimeout(2000)); // Simulate LLM response time
    if (response_json_schema) {
      console.log("Returning mock JSON response for LLM.");
      return {
        example_field: "This is a mock LLM response based on your schema.",
        prompt_received: prompt.substring(0, 50) + "...",
      };
    }
    console.log("Returning mock string response for LLM.");
    return `Mock LLM response to: "${prompt.substring(0, 50)}..."`;
  },

  // Sends an email. Replace with your email service API (e.g., SendGrid, Mailgun).
  SendEmail: async ({ from_name, to, subject, body }) => {
    console.log("Mock SendEmail called with:", {
      from_name,
      to,
      subject,
      body,
    });
    await new Promise((resolve) => setTimeout(1000));
    console.log(`Mock email sent to ${to} with subject "${subject}"`);
    return { status: "success", message: "Mock email sent." };
  },

  // Uploads a file. Replace with your file storage API (e.g., AWS S3, Google Cloud Storage).
  UploadFile: async ({ file }) => {
    console.log("Mock UploadFile called with file:", file.name, file.type);
    await new Promise((resolve) => setTimeout(1500));
    const mockFileUrl = `https://mock-storage.example.com/public/${file.name}`;
    console.log("Mock file uploaded to:", mockFileUrl);
    return { file_url: mockFileUrl };
  },

  // Generates an image using AI. Replace with your image generation API (e.g., DALL-E, Midjourney API).
  GenerateImage: async ({ prompt }) => {
    console.log("Mock GenerateImage called with prompt:", prompt);
    await new Promise((resolve) => setTimeout(5000)); // Simulate image generation time
    const mockImageUrl = `https://mock-image-gen.example.com/image-${Date.now()}.png`;
    console.log("Mock image generated:", mockImageUrl);
    return { url: mockImageUrl };
  },

  // Extracts data from an uploaded file. Replace with your own data extraction service or library.
  ExtractDataFromUploadedFile: async ({ file_url, json_schema }) => {
    console.log("Mock ExtractDataFromUploadedFile called with:", {
      file_url,
      json_schema,
    });
    await new Promise((resolve) => setTimeout(3000));
    console.log("Returning mock extracted data.");
    return {
      status: "success",
      details: null,
      output: [
        { item: "Mock data from file", value: "123" },
        { item: "Schema provided", value: JSON.stringify(json_schema) },
      ],
    };
  },

  // Creates a signed URL for a private file. Replace with your private file storage solution.
  CreateFileSignedUrl: async ({ file_uri, expires_in }) => {
    console.log("Mock CreateFileSignedUrl called with:", {
      file_uri,
      expires_in,
    });
    await new Promise((resolve) => setTimeout(500));
    const mockSignedUrl = `${file_uri}?signature=mock_signature&expires=${
      Date.now() + expires_in * 1000
    }`;
    console.log("Mock signed URL created:", mockSignedUrl);
    return { signed_url: mockSignedUrl };
  },

  // Uploads a file to private storage. Replace with your private file storage solution.
  UploadPrivateFile: async ({ file }) => {
    console.log(
      "Mock UploadPrivateFile called with file:",
      file.name,
      file.type
    );
    await new Promise((resolve) => setTimeout(1500));
    const mockFileUri = `private-storage://${file.name}`;
    console.log("Mock private file uploaded, URI:", mockFileUri);
    return { file_uri: mockFileUri };
  },
};

export {
  Core as InvokeLLM,
  Core as SendEmail,
  Core as UploadFile,
  Core as GenerateImage,
  Core as ExtractDataFromUploadedFile,
  Core as CreateFileSignedUrl,
  Core as UploadPrivateFile,
};
