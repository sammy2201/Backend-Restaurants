import { FastifyRequest, FastifyReply } from "fastify";
import axios from "axios";
import { Coordinates, RestaurantQuery } from "../types/index.js";

const apiKey = process.env.API_KEY;

// Helper
async function getCoordinates(locationName: string): Promise<Coordinates> {
  const url = "https://maps.googleapis.com/maps/api/geocode/json";
  const params = { address: locationName, key: apiKey };
  const response = await axios.get(url, { params });

  if (!response.data.results || response.data.results.length === 0) {
    throw new Error("Invalid location or no results found");
  }

  const { lat, lng } = response.data.results[0].geometry.location;
  return { lat, lng };
}

const nextPageTokens: Record<string, string | null> = {};

export async function getAllRestaurants(
  request: FastifyRequest<{ Querystring: RestaurantQuery }>,
  reply: FastifyReply
) {
  const { location, lat, lng, radius, page } = request.query;

  if (!location && !(lat && lng)) {
    return reply.status(400).send({
      status: "error",
      data: null,
      message: "Provide either location name or lat & lng",
    });
  }

  try {
    let coordinates: Coordinates;
    if (location) {
      coordinates = await getCoordinates(location);
    } else {
      coordinates = { lat: lat!, lng: lng! };
    }

    const pageNum = parseInt(page || "1", 10);
    const key = location || `${lat},${lng}`;

    let params: any = {
      location: `${coordinates.lat},${coordinates.lng}`,
      radius: radius || 2500,
      type: "restaurant",
      key: apiKey,
    };

    if (pageNum > 1 && nextPageTokens[key]) {
      params.pagetoken = nextPageTokens[key];
      await new Promise((res) => setTimeout(res, 2000));
    }

    const url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
    const response = await axios.get(url, { params });
    const results = response.data.results || [];

    nextPageTokens[key] = response.data.next_page_token || null;

    reply.status(200).send({
      status: "success",
      data: {
        page: pageNum,
        results,
        hasMore: !!nextPageTokens[key],
      },
      message: "Restaurants fetched successfully",
    });
  } catch (err: any) {
    reply.status(500).send({
      status: "error",
      data: null,
      message: err.message || "Failed to fetch restaurants",
    });
  }
}

export async function getRestaurantById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;

  if (!id) {
    return reply.status(400).send({
      status: "error",
      data: null,
      message: "Restaurant ID (place_id) is required",
    });
  }

  try {
    const url = "https://maps.googleapis.com/maps/api/place/details/json";
    const response = await axios.get(url, {
      params: { place_id: id, key: apiKey },
    });

    if (!response.data.result) {
      return reply.status(404).send({
        status: "error",
        data: null,
        message: "Restaurant not found",
      });
    }

    reply.status(200).send({
      status: "success",
      data: response.data.result,
      message: "Restaurant details fetched successfully",
    });
  } catch (err: any) {
    reply.status(500).send({
      status: "error",
      data: null,
      message: err.message || "Failed to fetch restaurant details",
    });
  }
}
