const ART_PROJECTS = {
  order: [
    "wendigo",
    "caveman",
    "minecraft_renders",
    "photoshop_art",
    "animated_graphics",
    "jade_sword_lore",
    "the_janitors_night_shift",
  ],
  data: {
    wendigo: {
      title: "Wendigo Character Design and Animation",
      description:
        "A few videos of a Wendigo character I designed and animated. I wanted to make something in the horror genre and a Wendigo is a great creature to use for that as it is part of the human animal beast collection along with the 'Wearwolf', 'Minotaur', 'Harpie', 'Satyr', and 'Centaur'.<br><br>The horror I am most interested in is techically phycologial horror. However the meaning of that is not as detailed as it can be. There are so many thoughts that flare up in your mind as you experience something scary or threatening. And while each one is very complex, they all follow a similar pattern that horror movies have been trying to capitalize on for years. And while I am NOT saying that I did so in these animations, I had that in mind while making them. Especially in the street scene ;)",
      size: { width: 3, height: 2 },
      thumbnails: [
        { image: "wendigo/wendigo_car.png", video: "wendigo/wendigo_car.mp4" },
        {
          image: "wendigo/wendigo_school_chase.png",
          video: "wendigo/wendigo_school_chase.mp4",
        },
      ],
      links: [],
      date: "December 2022",
      tags: ["Horror", "Animation", "Character Design"],
      backgroundColor: "#3A0C0C",
      primaryColor: "#DB3434",
    },

    caveman: {
      title: "Caveman",
      description: "A study on human form and blenders hair generation",
      size: { width: 1, height: 1 },
      thumbnails: [
        { image: "caveman/neck.png" },
        { image: "caveman/back.png" },
        { image: "caveman/front.png" },
      ],
      links: [],
      date: "",
      tags: ["Modeling", "Blender"],
      backgroundColor: "#2C502C",
      primaryColor: "#34DB34",
    },

    minecraft_renders: {
      title: "Minecraft Renders",
      description:
        "Blender has a cool addon for taking a seed in minecraft or loading a chunk from a file and building the meshes and textures into the blender scene. And so I used it to make these.<br><br>In that process I had to make some custom models like the minecraft guy, the items, and the torch lighting and flame effects. I think this was just cool to make!",
      size: { width: 1, height: 2 },
      thumbnails: [
        { image: "minecraft_renders/minecraft_steve_on_his_dock_reading.png" },
        { image: "minecraft_renders/minecraft_cabin_cctv_view.png" },
        { image: "minecraft_renders/minecraft_cabin_torch_view.png" },
      ],
      links: [],
      date: "",
      tags: ["Minecraft", "Modeling", "Blender"],
      backgroundColor: "#2C4C50",
      primaryColor: "#89FFE2",
    },

    photoshop_art: {
      title: "Photoshop Art",
      description:
        "I primarily focus on 3D art but sometimes I just play around in photoshop and see what I can make!<br><br>Currently only have one of them cause of a hardrive thing, gotta unpack some recently semi corrupted backups. In do time!",
      size: { width: 1, height: 2 },
      thumbnails: [{ image: "photoshop_art/top_hat_suit_art.png" }],
      links: [],
      date: "",
      tags: ["Photoshop"],
      backgroundColor: "#D34E24",
      primaryColor: "#F7F052",
    },
    jade_sword_lore: {
      title: "Jade Sword Lore",
      description:
        "I had this dream a long time ago where I had a jade colored sword and it allowed me to fly kinda like Thor's hammer. The dream was very detailed and I wrote some notes of it down. Then a few months later I remembered it and saw the notes and it made me want to make some imagery of what I remembered. So this is that!<br><br>You can see the cave with the sword in the mountain images at the top of the tallest mountain.",
      size: { width: 2, height: 2 },
      thumbnails: [
        { image: "jade_sword_lore/landscape_day.png" },
        { image: "jade_sword_lore/landscape_night1.png" },
        { image: "jade_sword_lore/landscape_night2.png" },
        { image: "jade_sword_lore/cave_sword.png" },
      ],
      links: [],
      date: "",
      tags: ["Environment", "Blender"],
      backgroundColor: "#115B24",
      primaryColor: "#F1DDA2",
    },
    animated_graphics: {
      title: "3D Animated Graphics",
      description: "A collection of visually interesting 3D animations",
      size: { width: 2, height: 2 },
      thumbnails: [
        {
          image: "animated_graphics/wave_of_cubes.jpg",
          video: "animated_graphics/wave_of_cubes.mp4",
        },
        {
          image: "animated_graphics/turbulent_particle_flow.jpg",
          video: "animated_graphics/turbulent_particle_flow.mp4",
        },
        {
          image: "animated_graphics/low_poly_car.jpg",
          video: "animated_graphics/low_poly_car.mp4",
        },
        {
          image: "animated_graphics/robot_dog.jpg",
          video: "animated_graphics/robot_dog.mp4",
        },
        {
          image: "animated_graphics/robot_man.jpg",
          video: "animated_graphics/robot_man.mp4",
        },
        {
          image: "animated_graphics/top_hat_robot.jpg",
          video: "animated_graphics/top_hat_robot.mp4",
        },
      ],
      links: [],
      date: "",
      tags: ["Animated Graphics", "Blender"],
      backgroundColor: "#71136E",
      primaryColor: "#BACDFF",
    },

    the_janitors_night_shift: {
      title: "The Janitor's Night Shift",
      description:
        "This is temporary but use the link to watch<br><br>My work here centers on a first-person horror game trailer where players become a night shift janitor at an art gallery. The concept blends mundane tasks with growing unease and dread from unseen threats. The core experience focuses on keeping players in a state of tension through uncertainty. While this trailer serves as a proof of concept to generate excitement for the full game, it aims to create a unique and resonant horror experience that stands apart from conventional entries in the genre.",
      size: { width: 2, height: 2 },
      thumbnails: [
        {
          image: "the_janitors_night_shift/thumbnail.png",
          video: "https://youtu.be/JLlryaUJT_g?si=cEn3oVFuHfmQO0GK",
        },
      ],
      links: [
        {
          text: "YouTube Link To Watch",
          url: "https://youtu.be/JLlryaUJT_g?si=cEn3oVFuHfmQO0GK",
          icon: "youtube",
        },
      ],
      date: "",
      tags: ["Horror", "Art Gallery", "Blender"],
      backgroundColor: "#3A0C0C",
      primaryColor: "#DB3434",
    },
  },
};
