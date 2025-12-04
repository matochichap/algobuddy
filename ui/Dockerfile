FROM node:20-alpine AS builder

WORKDIR /app

COPY ./shared/ ./shared/
COPY ./ui/ ./ui/

WORKDIR /app/ui

RUN yarn shared
RUN yarn install

# Accept build arguments
ARG NEXT_PUBLIC_USER_SERVICE_BASE_URL
ARG NEXT_PUBLIC_MATCHING_SERVICE_BASE_URL
ARG NEXT_PUBLIC_QUESTION_SERVICE_BASE_URL
ARG NEXT_PUBLIC_COLLABORATION_SERVICE_BASE_URL
ARG NEXT_PUBLIC_PISTON_API_BASE_URL

# Set them as environment variables for the build process
ENV NEXT_PUBLIC_USER_SERVICE_BASE_URL=$NEXT_PUBLIC_USER_SERVICE_BASE_URL
ENV NEXT_PUBLIC_MATCHING_SERVICE_BASE_URL=$NEXT_PUBLIC_MATCHING_SERVICE_BASE_URL
ENV NEXT_PUBLIC_QUESTION_SERVICE_BASE_URL=$NEXT_PUBLIC_QUESTION_SERVICE_BASE_URL
ENV NEXT_PUBLIC_COLLABORATION_SERVICE_BASE_URL=$NEXT_PUBLIC_COLLABORATION_SERVICE_BASE_URL
ENV NEXT_PUBLIC_PISTON_API_BASE_URL=$NEXT_PUBLIC_PISTON_API_BASE_URL

RUN yarn build

FROM node:20-alpine AS runner

WORKDIR /app/ui

COPY --from=builder /app/ui/.next ./.next
COPY --from=builder /app/ui/public ./public
COPY --from=builder /app/ui/node_modules ./node_modules
COPY --from=builder /app/ui/next.config.ts ./next.config.ts
COPY --from=builder /app/ui/package.json ./package.json
COPY --from=builder /app/ui/yarn.lock ./yarn.lock

EXPOSE 3000

CMD ["yarn", "start"]