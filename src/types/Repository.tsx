export interface Repository {
  id: number;
  name: string;
  slug: string;
  project: {
    key: string;
    name: string;
  };
  links?: {
    self: {
      href: string;
    }[];
  };
}
