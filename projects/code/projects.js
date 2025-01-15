const CODE_PROJECTS = {
  order: ["chatollama", "chatollamaagent"],
  data: {
    chatollama: {
      title: "Chat Ollama",
      description:
        "A Python module to streamline conversational AI with the ollama library, providing efficient and customizable chat engines. ChatOllama offers conversation management and configuration options, ideal for building interactive assistants, customer service bots, and other conversational AI applications.",
      size: { width: 2, height: 2 },
      thumbnails: [
        {
          image: "chatollama/showcase_structured_responses_rendered.png",
        },
      ],
      links: [
        {
          text: "PyPI Package",
          url: "https://pypi.org/project/chatollama/",
          icon: "box-seam",
        },
      ],
      date: "First Release: Sep 5, 2024 - Last Release: Jan 3, 2025",
      tags: ["Python", "Ollama", "Conversational AI"],
    },
    chatollamaagent: {
      title: "Chat Ollama Agent",
      description:
        "A visual node-based programming system for creating and managing chat-based workflows. Design your chat flows visually, connect nodes to create logic, and execute the networks with the built-in runner.",
      size: { width: 2, height: 2 },
      thumbnails: [
        {
          image: "chatollamaagent/interface-overview.png",
        },
      ],
      links: [
        {
          text: "PyPI Package",
          url: "https://pypi.org/project/chatollamaagent/",
          icon: "box-seam",
        },
        {
          text: "Github",
          url: "https://github.com/SpicyMelonYT/ChatOllamaAgent",
          icon: "github",
        },
      ],
      date: "First Release: Jan 3, 2025 - Last Release: Jan 8, 2025",
      tags: ["Python", "Ollama", "Agentic AI", "Node-based"],
    },
  },
};
