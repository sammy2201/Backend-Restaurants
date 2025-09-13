import { FastifyRequest, FastifyReply } from "fastify";
import axios from "axios";

const apiKey = process.env.API_KEY;

export async function getIndex(request: FastifyRequest, reply: FastifyReply) {
  reply.send("Welcome to the backend application!");
}

// Helper: convert location name to coordinates
async function getCoordinates(locationName: string) {
  const url = "https://maps.googleapis.com/maps/api/geocode/json";
  const params = { address: locationName, key: apiKey };
  const response = await axios.get(url, { params });

  if (!response.data.results || response.data.results.length === 0) {
    throw new Error("Invalid location or no results found");
  }

  const { lat, lng } = response.data.results[0].geometry.location;
  return { lat, lng };
}

// Store tokens temporarily (for simplicity, per location string)
const nextPageTokens: Record<string, string | null> = {};

export async function getAllRestaurants(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { location, lat, lng, radius, page } = request.query as {
    location?: string;
    lat?: string;
    lng?: string;
    radius?: string;
    page?: string;
  };

  if (!location && !(lat && lng)) {
    return reply
      .status(400)
      .send({ error: "Provide either location name or lat & lng" });
  }

  try {
    let coordinates: { lat: string; lng: string };
    if (location) {
      coordinates = await getCoordinates(location);
    } else {
      coordinates = { lat: lat!, lng: lng! };
    }

    const pageNum = parseInt(page || "1", 10);
    const key = location || `${lat},${lng}`; // store token per location

    let params: any = {
      location: `${coordinates.lat},${coordinates.lng}`,
      radius: radius || 2500,
      type: "restaurant",
      key: apiKey,
    };

    // If requesting page > 1, use saved next_page_token
    if (pageNum > 1 && nextPageTokens[key]) {
      params.pagetoken = nextPageTokens[key];
      // Google requires a short delay before using next_page_token
      await new Promise((res) => setTimeout(res, 2000));
    }

    const url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
    const response = await axios.get(url, { params });
    const results = response.data.results || [];

    // Save next_page_token for the next request
    nextPageTokens[key] = response.data.next_page_token || null;

    reply.send({
      page: pageNum,
      results,
      hasMore: !!nextPageTokens[key],
    });
  } catch (err: any) {
    reply.status(500).send({
      error: "Failed to fetch restaurants",
      details: err.message,
    });
  }
}

export async function getRestaurantById(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };
  if (!id) {
    return reply
      .status(400)
      .send({ error: "Restaurant ID (place_id) is required" });
  }

  try {
    console.log("Fetching details for place_id:", id);
    const url = "https://maps.googleapis.com/maps/api/place/details/json";
    const params: any = {
      place_id: id,
      key: apiKey,
    };
    // const response = await axios.get(url, { params });

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${id}&key=${apiKey}`
    );

    if (!response.data.result) {
      return reply.status(404).send({ error: "Restaurant not found" });
    }

    reply.send(response.data.result);
  } catch (err: any) {
    reply.status(500).send({
      error: "Failed to fetch restaurant details",
      details: err.message,
    });
  }
}
