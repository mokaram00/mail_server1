# Get Organization

> Get an organization by ID.

**Scopes**: `organizations:read` `organizations:write`

## OpenAPI

````yaml GET /v1/organizations/{id}
paths:
  path: /v1/organizations/{id}
  method: get
  servers:
    - url: https://api.polar.sh
      description: Production environment
    - url: https://sandbox-api.polar.sh
      description: Sandbox environment
  request:
    security:
      - title: access token
        parameters:
          query: {}
          header:
            Authorization:
              type: http
              scheme: bearer
              description: >-
                You can generate an **Organization Access Token** from your
                organization's settings.
          cookie: {}
    parameters:
      path:
        id:
          schema:
            - type: string
              required: true
              title: Id
              description: The organization ID.
              examples:
                - 1dbfc517-0bbf-4301-9ba8-555ca42b9737
              format: uuid4
              example: 1dbfc517-0bbf-4301-9ba8-555ca42b9737
      query: {}
      header: {}
      cookie: {}
    body: {}
    codeSamples:
      - label: Go (SDK)
        lang: go
        source: "package main\n\nimport(\n\t\"context\"\n\t\"os\"\n\tpolargo \"github.com/polarsource/polar-go\"\n\t\"log\"\n)\n\nfunc main() {\n    ctx := context.Background()\n\n    s := polargo.New(\n        polargo.WithSecurity(os.Getenv(\"POLAR_ACCESS_TOKEN\")),\n    )\n\n    res, err := s.Organizations.Get(ctx, \"1dbfc517-0bbf-4301-9ba8-555ca42b9737\")\n    if err != nil {\n        log.Fatal(err)\n    }\n    if res.Organization != nil {\n        // handle response\n    }\n}"
      - label: Python (SDK)
        lang: python
        source: |-
          from polar_sdk import Polar


          with Polar(
              access_token="<YOUR_BEARER_TOKEN_HERE>",
          ) as polar:

              res = polar.organizations.get(id="1dbfc517-0bbf-4301-9ba8-555ca42b9737")

              # Handle response
              print(res)
      - label: Typescript (SDK)
        lang: typescript
        source: |-
          import { Polar } from "@polar-sh/sdk";

          const polar = new Polar({
            accessToken: process.env["POLAR_ACCESS_TOKEN"] ?? "",
          });

          async function run() {
            const result = await polar.organizations.get({
              id: "1dbfc517-0bbf-4301-9ba8-555ca42b9737",
            });

            console.log(result);
          }

          run();
      - label: PHP (SDK)
        lang: php
        source: |-
          declare(strict_types=1);

          require 'vendor/autoload.php';

          use Polar;

          $sdk = Polar\Polar::builder()
              ->setSecurity(
                  '<YOUR_BEARER_TOKEN_HERE>'
              )
              ->build();



          $response = $sdk->organizations->get(
              id: '1dbfc517-0bbf-4301-9ba8-555ca42b9737'
          );

          if ($response->organization !== null) {
              // handle response
          }
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              created_at:
                allOf:
                  - type: string
                    format: date-time
                    title: Created At
                    description: Creation timestamp of the object.
              modified_at:
                allOf:
                  - anyOf:
                      - type: string
                        format: date-time
                      - type: 'null'
                    title: Modified At
                    description: Last modification timestamp of the object.
              id:
                allOf:
                  - type: string
                    format: uuid4
                    title: Id
                    description: The organization ID.
                    examples:
                      - 1dbfc517-0bbf-4301-9ba8-555ca42b9737
                    x-polar-selector-widget:
                      displayProperty: name
                      resourceName: Organization
                      resourceRoot: /v1/organizations
              name:
                allOf:
                  - type: string
                    title: Name
                    description: >-
                      Organization name shown in checkout, customer portal,
                      emails etc.
              slug:
                allOf:
                  - type: string
                    title: Slug
                    description: >-
                      Unique organization slug in checkout, customer portal and
                      credit card statements.
              avatar_url:
                allOf:
                  - anyOf:
                      - type: string
                      - type: 'null'
                    title: Avatar Url
                    description: Avatar URL shown in checkout, customer portal, emails etc.
              email:
                allOf:
                  - anyOf:
                      - type: string
                      - type: 'null'
                    title: Email
                    description: Public support email.
              website:
                allOf:
                  - anyOf:
                      - type: string
                      - type: 'null'
                    title: Website
                    description: Official website of the organization.
              socials:
                allOf:
                  - items:
                      $ref: '#/components/schemas/OrganizationSocialLink'
                    type: array
                    title: Socials
                    description: Links to social profiles.
              status:
                allOf:
                  - $ref: '#/components/schemas/Status'
                    description: Current organization status
              details_submitted_at:
                allOf:
                  - anyOf:
                      - type: string
                        format: date-time
                      - type: 'null'
                    title: Details Submitted At
                    description: When the business details were submitted.
              feature_settings:
                allOf:
                  - anyOf:
                      - $ref: '#/components/schemas/OrganizationFeatureSettings'
                      - type: 'null'
                    description: Organization feature settings
              subscription_settings:
                allOf:
                  - $ref: '#/components/schemas/OrganizationSubscriptionSettings'
                    description: Settings related to subscriptions management
              notification_settings:
                allOf:
                  - $ref: '#/components/schemas/OrganizationNotificationSettings'
                    description: Settings related to notifications
              customer_email_settings:
                allOf:
                  - $ref: '#/components/schemas/OrganizationCustomerEmailSettings'
                    description: Settings related to customer emails
            title: Organization
            refIdentifier: '#/components/schemas/Organization'
            requiredProperties:
              - created_at
              - modified_at
              - id
              - name
              - slug
              - avatar_url
              - email
              - website
              - socials
              - status
              - details_submitted_at
              - feature_settings
              - subscription_settings
              - notification_settings
              - customer_email_settings
        examples:
          example:
            value:
              created_at: '2023-11-07T05:31:56Z'
              modified_at: '2023-11-07T05:31:56Z'
              id: 1dbfc517-0bbf-4301-9ba8-555ca42b9737
              name: <string>
              slug: <string>
              avatar_url: <string>
              email: <string>
              website: <string>
              socials:
                - platform: x
                  url: <string>
              status: created
              details_submitted_at: '2023-11-07T05:31:56Z'
              feature_settings:
                issue_funding_enabled: false
                seat_based_pricing_enabled: false
                revops_enabled: false
              subscription_settings:
                allow_multiple_subscriptions: true
                allow_customer_updates: true
                proration_behavior: invoice
              notification_settings:
                new_order: true
                new_subscription: true
              customer_email_settings:
                order_confirmation: true
                subscription_cancellation: true
                subscription_confirmation: true
                subscription_cycled: true
                subscription_past_due: true
                subscription_revoked: true
                subscription_uncanceled: true
                subscription_updated: true
        description: Successful Response
    '404':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: string
                    const: ResourceNotFound
                    title: Error
                    examples:
                      - ResourceNotFound
              detail:
                allOf:
                  - type: string
                    title: Detail
            title: ResourceNotFound
            refIdentifier: '#/components/schemas/ResourceNotFound'
            requiredProperties:
              - error
              - detail
        examples:
          example:
            value:
              error: ResourceNotFound
              detail: <string>
        description: Organization not found.
    '422':
      application/json:
        schemaArray:
          - type: object
            properties:
              detail:
                allOf:
                  - items:
                      $ref: '#/components/schemas/ValidationError'
                    type: array
                    title: Detail
            title: HTTPValidationError
            refIdentifier: '#/components/schemas/HTTPValidationError'
        examples:
          example:
            value:
              detail:
                - loc:
                    - <string>
                  msg: <string>
                  type: <string>
        description: Validation Error
  deprecated: false
  type: path
components:
  schemas:
    OrganizationCustomerEmailSettings:
      properties:
        order_confirmation:
          type: boolean
          title: Order Confirmation
        subscription_cancellation:
          type: boolean
          title: Subscription Cancellation
        subscription_confirmation:
          type: boolean
          title: Subscription Confirmation
        subscription_cycled:
          type: boolean
          title: Subscription Cycled
        subscription_past_due:
          type: boolean
          title: Subscription Past Due
        subscription_revoked:
          type: boolean
          title: Subscription Revoked
        subscription_uncanceled:
          type: boolean
          title: Subscription Uncanceled
        subscription_updated:
          type: boolean
          title: Subscription Updated
      type: object
      required:
        - order_confirmation
        - subscription_cancellation
        - subscription_confirmation
        - subscription_cycled
        - subscription_past_due
        - subscription_revoked
        - subscription_uncanceled
        - subscription_updated
      title: OrganizationCustomerEmailSettings
    OrganizationFeatureSettings:
      properties:
        issue_funding_enabled:
          type: boolean
          title: Issue Funding Enabled
          description: If this organization has issue funding enabled
          default: false
        seat_based_pricing_enabled:
          type: boolean
          title: Seat Based Pricing Enabled
          description: If this organization has seat-based pricing enabled
          default: false
        revops_enabled:
          type: boolean
          title: Revops Enabled
          description: If this organization has RevOps enabled
          default: false
      type: object
      title: OrganizationFeatureSettings
    OrganizationNotificationSettings:
      properties:
        new_order:
          type: boolean
          title: New Order
        new_subscription:
          type: boolean
          title: New Subscription
      type: object
      required:
        - new_order
        - new_subscription
      title: OrganizationNotificationSettings
    OrganizationSocialLink:
      properties:
        platform:
          $ref: '#/components/schemas/OrganizationSocialPlatforms'
          description: The social platform of the URL
        url:
          type: string
          maxLength: 2083
          minLength: 1
          format: uri
          title: Url
          description: The URL to the organization profile
      type: object
      required:
        - platform
        - url
      title: OrganizationSocialLink
    OrganizationSocialPlatforms:
      type: string
      enum:
        - x
        - github
        - facebook
        - instagram
        - youtube
        - tiktok
        - linkedin
        - other
      title: OrganizationSocialPlatforms
    OrganizationSubscriptionSettings:
      properties:
        allow_multiple_subscriptions:
          type: boolean
          title: Allow Multiple Subscriptions
        allow_customer_updates:
          type: boolean
          title: Allow Customer Updates
        proration_behavior:
          $ref: '#/components/schemas/SubscriptionProrationBehavior'
      type: object
      required:
        - allow_multiple_subscriptions
        - allow_customer_updates
        - proration_behavior
      title: OrganizationSubscriptionSettings
    Status:
      type: string
      enum:
        - created
        - onboarding_started
        - under_review
        - denied
        - active
      title: Status
    SubscriptionProrationBehavior:
      type: string
      enum:
        - invoice
        - prorate
      title: SubscriptionProrationBehavior
    ValidationError:
      properties:
        loc:
          items:
            anyOf:
              - type: string
              - type: integer
          type: array
          title: Location
        msg:
          type: string
          title: Message
        type:
          type: string
          title: Error Type
      type: object
      required:
        - loc
        - msg
        - type
      title: ValidationError

````