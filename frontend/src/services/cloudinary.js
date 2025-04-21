import {Cloudinary} from "@cloudinary/url-gen";

const cld = new Cloudinary({
  cloud: {
    cloudName: 'uwrs',
  }
});

export default cld;