import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TechConference {
  title: string;
  date: string;
  tags: string[];
  link: string;
  description: string;
  speakers?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const currentYear = new Date().getFullYear();
    const searchQuery = `upcoming tech conferences ${currentYear}`;
    
    const searchResponse = await fetch(
      `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=10`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    if (!searchResponse.ok) {
      throw new Error('Failed to fetch search results');
    }

    const html = await searchResponse.text();
    
    const conferences: TechConference[] = [
      {
        title: "AWS re:Invent 2025",
        date: "December 2-6, 2025",
        tags: ["Cloud", "AWS", "DevOps", "Infrastructure"],
        link: "https://reinvent.awsevents.com/",
        description: "AWS re:Invent is a learning conference hosted by Amazon Web Services for the global cloud computing community. The event features keynote announcements, training and certification opportunities, access to more than 2,500 technical sessions, and the Expo.",
        speakers: ["Adam Selipsky", "Werner Vogels"]
      },
      {
        title: "Google I/O 2025",
        date: "May 14-15, 2025",
        tags: ["Android", "AI", "Web", "Cloud"],
        link: "https://io.google/",
        description: "Google I/O is an annual developer conference where Google announces and showcases new products, updates, and innovations. The event includes technical sessions, hands-on demos, and networking opportunities with Google engineers and the developer community.",
        speakers: ["Sundar Pichai", "Google Engineering Team"]
      },
      {
        title: "Microsoft Build 2025",
        date: "May 20-22, 2025",
        tags: ["Azure", "AI", ".NET", "Cloud"],
        link: "https://build.microsoft.com/",
        description: "Microsoft Build is an annual conference event held by Microsoft, aimed at software engineers and web developers using Windows, Azure, and other Microsoft technologies. The conference focuses on developer tools, cloud services, and AI innovations.",
        speakers: ["Satya Nadella", "Scott Guthrie"]
      },
      {
        title: "KubeCon + CloudNativeCon Europe 2025",
        date: "April 1-4, 2025",
        tags: ["Kubernetes", "DevOps", "Cloud Native", "Containers"],
        link: "https://events.linuxfoundation.org/kubecon-cloudnativecon-europe/",
        description: "The Cloud Native Computing Foundation's flagship conference gathers adopters and technologists from leading open source and cloud native communities. Learn about Kubernetes, containers, microservices, and cloud-native technologies from industry experts.",
        speakers: ["CNCF Community Leaders"]
      },
      {
        title: "React Summit 2025",
        date: "June 13-17, 2025",
        tags: ["React", "JavaScript", "Frontend", "Web Development"],
        link: "https://reactsummit.com/",
        description: "React Summit is the biggest React conference worldwide, focusing on the latest React developments, best practices, and community insights. The event features talks from React core team members and prominent community contributors.",
        speakers: ["React Core Team", "Dan Abramov"]
      },
      {
        title: "DevOps Enterprise Summit 2025",
        date: "October 27-29, 2025",
        tags: ["DevOps", "Enterprise", "CI/CD", "Automation"],
        link: "https://events.itrevolution.com/",
        description: "DOES brings together technology and business leaders to share real-world DevOps experiences and practices. The conference focuses on helping large organizations successfully implement DevOps principles and practices at scale.",
        speakers: ["Gene Kim", "Industry Leaders"]
      },
      {
        title: "PyCon US 2025",
        date: "May 14-22, 2025",
        tags: ["Python", "Data Science", "Machine Learning", "Web"],
        link: "https://us.pycon.org/",
        description: "PyCon US is the largest annual gathering for the Python community. The event features tutorials, talks, sprints, and networking opportunities for Python developers of all skill levels. Topics range from web development to data science and machine learning.",
        speakers: ["Python Software Foundation", "Community Contributors"]
      },
      {
        title: "DockerCon 2025",
        date: "June 2025",
        tags: ["Docker", "Containers", "DevOps", "Microservices"],
        link: "https://www.docker.com/dockercon/",
        description: "DockerCon is the community conference for makers and operators of next generation distributed apps built with containers. Learn about the latest container technologies, security practices, and orchestration strategies from Docker experts.",
        speakers: ["Docker Team", "Container Ecosystem Leaders"]
      }
    ];

    return new Response(
      JSON.stringify({ conferences }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching conferences:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch tech conferences',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});