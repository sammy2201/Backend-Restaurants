export type Coordinates = {
  lat: string;
  lng: string;
};

export type RestaurantQuery = {
  location?: string;
  lat?: string;
  lng?: string;
  radius?: string;
  page?: string;
};
