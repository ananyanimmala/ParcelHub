package ParcelHub.entity;

import ParcelHub.enums.ParcelStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "parcel_tracking")
public class ParcelTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "parcel_id", nullable = false)
    private Parcel parcel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ParcelStatus status;

    private LocalDateTime updatedAt;

    // Default constructor
    public ParcelTracking() {
    }

    // Parameterized constructor
    public ParcelTracking(Parcel parcel,
                          ParcelStatus status,
                          LocalDateTime updatedAt) {
        this.parcel = parcel;
        this.status = status;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public Parcel getParcel() {
        return parcel;
    }

    public void setParcel(Parcel parcel) {
        this.parcel = parcel;
    }

    public ParcelStatus getStatus() {
        return status;
    }

    public void setStatus(ParcelStatus status) {
        this.status = status;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}