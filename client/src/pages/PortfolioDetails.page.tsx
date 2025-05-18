import { useParams } from "react-router"

export function PortfolioDetailsPage() {
    const {portfolioId} = useParams()
    return <>
    Portfolio Details for {portfolioId}
    </>
}