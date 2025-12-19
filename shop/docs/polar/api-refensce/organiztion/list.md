# List Organizations

> List organizations.

**Scopes**: `organizations:read` `organizations:write`

## OpenAPI

````yaml get /v1/organizations/
paths:
  path: /v1/organizations/
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
      path: {}
      query:
        slug:
          schema:
            - type: string
              required: false
              title: Slug
              description: Filter by slug.
            - type: 'null'
              required: false
              title: Slug
              description: Filter by slug.
        page:
          schema:
            - type: integer
              required: false
              title: Page
              description: Page number, defaults to 1.
              minimum: 0
              exclusiveMinimum: true
              default: 1
        limit:
          schema:
            - type: integer
              required: false
              title: Limit
              description: Size of a page, defaults to 10. Maximum is 100.
              minimum: 0
              exclusiveMinimum: true
              default: 10
        sorting:
          schema:
            - type: array
              items:
                allOf:
                  - $ref: '#/components/schemas/OrganizationSortProperty'
              required: false
              title: Sorting
              description: >-
                Sorting criterion. Several criteria can be used simultaneously
                and will be applied in order. Add a minus sign `-` before the
                criteria name to sort by descending order.
              default: &ref_0
                - created_at
            - type: 'null'
              required: false
              title: Sorting
              description: >-
                Sorting criterion. Several criteria can be used simultaneously
                and will be applied in order. Add a minus sign `-` before the
                criteria name to sort by descending order.
              default: *ref_0
      header: {}
      cookie: {}
    body: {}
    codeSamples:
      - label: Go (SDK)
        lang: go
        source: "package main\n\nimport(\n\t\"context\"\n\t\"os\"\n\tpolargo \"github.com/polarsource/polar-go\"\n\t\"log\"\n)\n\nfunc main() {\n    ctx := context.Background()\n\n    s := polargo.New(\n        polargo.WithSecurity(os.Getenv(\"POLAR_ACCESS_TOKEN\")),\n    )\n\n    res, err := s.Organizations.List(ctx, nil, polargo.Pointer[int64](1), polargo.Pointer[int64](10), nil)\n    if err != nil {\n        log.Fatal(err)\n    }\n    if res.ListResourceOrganization != nil {\n        for {\n            // handle items\n\n            res, err = res.Next()\n\n            if err != nil {\n                // handle error\n            }\n\n            if res == nil {\n                break\n            }\n        }\n    }\n}"
      - label: Python (SDK)
        lang: python
        source: |-
          from polar_sdk import Polar


          with Polar(
              access_token="<YOUR_BEARER_TOKEN_HERE>",
          ) as polar:

              res = polar.organizations.list(page=1, limit=10)

              while res is not None:
                  # Handle items

                  res = res.next()
      - label: Typescript (SDK)
        lang: typescript
        source: |-
          import { Polar } from "@polar-sh/sdk";

          const polar = new Polar({
            accessToken: process.env["POLAR_ACCESS_TOKEN"] ?? "",
          });

          async function run() {
            const result = await polar.organizations.list({});

            for await (const page of result) {
              console.log(page);
            }
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



          $responses = $sdk->organizations->list(
              page: 1,
              limit: 10

          );


          foreach ($responses as $response) {
              if ($response->statusCode === 200) {
                  // handle response
              }
          }
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              items:
                allOf:
                  - items:
                      $ref: '#/components/schemas/Organization'
                    type: array
                    title: Items
              pagination:
                allOf:
                  - $ref: '#/components/schemas/Pagination'
            title: ListResource[Organization]
            refIdentifier: '#/components/schemas/ListResource_Organization_'
            requiredProperties:
              - items
              - pagination
        examples:
          example:
            value:
              items:
                - created_at: '2023-11-07T05:31:56Z'
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
              pagination:
                total_count: 123
                max_page: 123
        description: Successful Response
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
    Organization:
      properties:
        created_at:
          type: string
          format: date-time
          title: Created At
          description: Creation timestamp of the object.
        modified_at:
          anyOf:
            - type: string
              format: date-time
            - type: 'null'
          title: Modified At
          description: Last modification timestamp of the object.
        id:
          type: string
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
          type: string
          title: Name
          description: Organization name shown in checkout, customer portal, emails etc.
        slug:
          type: string
          title: Slug
          description: >-
            Unique organization slug in checkout, customer portal and credit
            card statements.
        avatar_url:
          anyOf:
            - type: string
            - type: 'null'
          title: Avatar Url
          description: Avatar URL shown in checkout, customer portal, emails etc.
        email:
          anyOf:
            - type: string
            - type: 'null'
          title: Email
          description: Public support email.
        website:
          anyOf:
            - type: string
            - type: 'null'
          title: Website
          description: Official website of the organization.
        socials:
          items:
            $ref: '#/components/schemas/OrganizationSocialLink'
          type: array
          title: Socials
          description: Links to social profiles.
        status:
          $ref: '#/components/schemas/Status'
          description: Current organization status
        details_submitted_at:
          anyOf:
            - type: string
              format: date-time
            - type: 'null'
          title: Details Submitted At
          description: When the business details were submitted.
        feature_settings:
          anyOf:
            - $ref: '#/components/schemas/OrganizationFeatureSettings'
            - type: 'null'
          description: Organization feature settings
        subscription_settings:
          $ref: '#/components/schemas/OrganizationSubscriptionSettings'
          description: Settings related to subscriptions management
        notification_settings:
          $ref: '#/components/schemas/OrganizationNotificationSettings'
          description: Settings related to notifications
        customer_email_settings:
          $ref: '#/components/schemas/OrganizationCustomerEmailSettings'
          description: Settings related to customer emails
      type: object
      required:
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
      title: Organization
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
    OrganizationSortProperty:
      type: string
      enum:
        - created_at
        - '-created_at'
        - slug
        - '-slug'
        - name
        - '-name'
        - next_review_threshold
        - '-next_review_threshold'
        - days_in_status
        - '-days_in_status'
      title: OrganizationSortProperty
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
    Pagination:
      properties:
        total_count:
          type: integer
          title: Total Count
        max_page:
          type: integer
          title: Max Page
      type: object
      required:
        - total_count
        - max_page
      title: Pagination
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