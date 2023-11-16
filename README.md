<!--
title: 'AWS NodeJS Example'
description: 'This template demonstrates how to deploy a NodeJS function running on AWS Lambda using the traditional Serverless Framework.'
layout: Doc
framework: v3
platform: AWS
language: nodeJS
priority: 1
authorLink: 'https://github.com/serverless'
authorName: 'Serverless, inc.'
authorAvatar: 'https://avatars1.githubusercontent.com/u/13742415?s=200&v=4'
-->

# HOW TO USE

- Download and install Insomnia
- Deploy to your AWS: `sls deploy`
- Follow the instructions for each endpoint

## POST-request for booking a/more rooms:

- Endpoint: /book

```json
{
  "numberOfGuests": 3,
  "checkInDate": "2023-12-14",
  "checkOutDate": "2023-12-18",
  "rooms": [
    {
      "id": 1,
      "type": "single",
      "quantity": 2,
      "costPerNight": 500
    },
    {
      "id": 14,
      "type": "double",
      "quantity": 1,
      "costPerNight": 1000
    }
  ],
  "referencePerson": {
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
}
```

## UPDATE-request to change a booking:

- Endpoint: /bookings/{id}

```json
{
  "bookingUpdate": {
    "numberOfGuests": 3,
    "checkInDate": "2023-11-18",
    "checkOutDate": "2023-11-22",
    "rooms": [
      {
        "type": "single",
        "quantity": 1
      },
      {
        "type": "suite",
        "quantity": 2
      }
    ]
  }
}
```

## DELETE-request to cancel a booking:

- Endpoint: /bookings/{id}

```json
{
  "bookingCancellation": {
    "bookingNumber": "B123456789"
  }
}
```

## POST-request for booking with availability check:

- Endpoint: /bookings

```json
{
	"numberOfGuests": "3",
	"checkInDate": "2023-11-17",
	"checkOutDate": "2023-11-18",
	"rooms": [
			{
					"roomSize": "1",
					"quantity": "1"
			},
			{
					"roomSize": "2",
					"quantity": "1"
			},
			{
					"roomSize": "3",
					"quantity": "1"
			}
	],
	"referencePerson": {
			"name": "NAME",
			"email": "EMAIL"
	}
}
```
## GET-request for all current bookings (with or without dates):

- Endpoint: /bookings?checkInDate=2023-11-17&checkOutDate=2023-11-18
- Endpoint: /bookings

## GET-request for all available rooms (with or without ROOMSIZE):

- Endpoint: /rooms?checkInDate=2023-11-10&checkOutDate=2023-11-15&roomSize=2
- Endpoint: /rooms?checkInDate=2023-11-10&checkOutDate=2023-11-15

## PATCH-request for updating a booking:

- Endpoint: /bookings/{id}

```json
{
	"numberOfGuests": "2",
	"checkInDate": "2023-11-16",
	"checkOutDate": "2023-11-19",
	"rooms": [
			{
					"roomSize": "1",
					"quantity": "1"
			},
			{
					"roomSize": "2",
					"quantity": "1"
			}
	
	]
}
```