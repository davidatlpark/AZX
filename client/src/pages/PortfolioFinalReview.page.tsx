import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Paper,
  Alert,
  List,
  Divider,
  Badge,
  Loader,
  Center,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconCheck,
  IconInfoCircle,
  IconAlertCircle,
  IconHome,
} from "@tabler/icons-react";

// This interface should match the backend Address model structure
interface Address {
  id?: string;
  name?: string;
  unit?: string;
  house_number?: string;
  street?: string;
  address_line?: string;
  neighborhood?: string;
  city?: string;
  county?: string;
  state?: string;
  state_code?: string;
  country?: string;
  country_code?: string;
  postal_code?: string;
  formatted_address?: string;
  latitude?: string; // Note: string, not number
  longitude?: string; // Note: string, not number
}

interface CreatePortfolioPayload {
  title: string;
  description?: string;
  properties: Address[];
}

export function PortfolioFinalReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  // Get data from navigation state
  const {
    file,
    columnMappings,
    mappedData,
    portfolioTitle,
    portfolioDescription,
  } = location.state || {};

  useEffect(() => {
    if (!file || !columnMappings || !mappedData || !portfolioTitle) {
      navigate("/portfolio/import");
      return;
    }
  }, [file, columnMappings, mappedData, portfolioTitle, navigate]);

  const validProperties = mappedData?.filter((row: any) => row._isValid) || [];
  const invalidProperties =
    mappedData?.filter((row: any) => !row._isValid) || [];

  const handleBack = () => {
    navigate("/portfolio/import/details", {
      state: {
        file,
        columnMappings,
        mappedData,
        step: 4,
      },
    });
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const createPortfolioPayload = (): CreatePortfolioPayload => {
    // Define the valid Address fields to ensure we only include expected properties
    const validAddressFields = [
      "id",
      "name",
      "unit",
      "house_number",
      "street",
      "address_line",
      "neighborhood",
      "city",
      "county",
      "state",
      "state_code",
      "country",
      "country_code",
      "postal_code",
      "formatted_address",
      "latitude",
      "longitude",
    ];

    const properties: Address[] = validProperties.map((row: any) => {
      const property: Address = {};

      // Map each field from the row data, excluding internal fields
      Object.keys(row).forEach((key) => {
        if (!key.startsWith("_") && validAddressFields.includes(key)) {
          const value = row[key];
          if (value !== undefined && value !== null && value !== "") {
            // Keep latitude/longitude as strings to match API schema
            if (key === "latitude" || key === "longitude") {
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                (property as any)[key] = numValue.toString();
              }
            } else {
              (property as any)[key] = value.toString();
            }
          }
        }
      });

      return property;
    });

    return {
      title: portfolioTitle,
      description: portfolioDescription || undefined,
      properties,
    };
  };

  const handleCreatePortfolio = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const payload = createPortfolioPayload();

      const response = await fetch("/api/portfolio/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();

      // Show success state
      setSubmitSuccess(true);

    } catch (error) {
      console.error("Error creating portfolio:", error);
      setSubmitError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );

    } finally {
      setIsSubmitting(false);
    }
  };

  if (!file || !columnMappings || !mappedData || !portfolioTitle) {
    return null;
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1} mb="sm">
            Import Portfolio
          </Title>
          <Text color="dimmed" size="lg">
            Step 5 of 5: Final Review
          </Text>
        </div>

        <Paper withBorder p="xl" radius="md">
          <Stack gap="md">
            <div>
              <Title order={3}>Portfolio Summary</Title>
              <Text size="sm" color="dimmed">
                Review your portfolio before creation
              </Text>
            </div>

            <Stack gap="sm">
              <Group gap="xs">
                <Text fw={500}>Title:</Text>
                <Text>{portfolioTitle}</Text>
              </Group>

              {portfolioDescription && (
                <Group gap="xs" align="flex-start">
                  <Text fw={500}>Description:</Text>
                  <Text>{portfolioDescription}</Text>
                </Group>
              )}

              <Group gap="xs">
                <Text fw={500}>Source File:</Text>
                <Text>{file.name}</Text>
              </Group>
            </Stack>

            <Divider />

            <Stack gap="sm">
              <Group gap="xs">
                <Text fw={500}>Properties to Import:</Text>
                <Badge color="green" variant="light">
                  {validProperties.length} valid
                </Badge>
                {invalidProperties.length > 0 && (
                  <Badge color="red" variant="light">
                    {invalidProperties.length} invalid (will be skipped)
                  </Badge>
                )}
              </Group>

              <Alert
                icon={<IconInfoCircle size={16} />}
                title="Import Details"
                color="blue"
                variant="light"
              >
                <List size="sm" spacing="xs">
                  <List.Item>
                    {validProperties.length} properties will be imported
                  </List.Item>
                  {invalidProperties.length > 0 && (
                    <List.Item>
                      {invalidProperties.length} properties will be skipped due
                      to validation errors
                    </List.Item>
                  )}
                  <List.Item>
                    Once created, you can manage your portfolio from the
                    dashboard
                  </List.Item>
                </List>
              </Alert>

              {submitSuccess && (
                <Alert
                  icon={<IconCheck size={16} />}
                  title="Success!"
                  color="green"
                  variant="light"
                >
                  Portfolio "{portfolioTitle}" created successfully with{" "}
                  {validProperties.length} properties!
                </Alert>
              )}

              {submitError && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Error"
                  color="red"
                  variant="light"
                >
                  {submitError}
                </Alert>
              )}
            </Stack>
          </Stack>
        </Paper>

        <Group justify="space-between">
          <Button
            onClick={handleBack}
            variant="outline"
            leftSection={<IconArrowLeft size={16} />}
            disabled={isSubmitting}
          >
            Back
          </Button>
          
          {submitSuccess ? (
            <Button
              onClick={handleGoHome}
              variant="filled"
              leftSection={<IconHome size={16} />}
              color="green"
            >
              Go to Home
            </Button>
          ) : (
            <Button
              onClick={handleCreatePortfolio}
              disabled={isSubmitting || validProperties.length === 0}
              loading={isSubmitting}
              leftSection={
                isSubmitting ? <Loader size={16} /> : <IconCheck size={16} />
              }
            >
              {isSubmitting ? "Creating Portfolio..." : "Create Portfolio"}
            </Button>
          )}
        </Group>
      </Stack>
    </Container>
  );
}